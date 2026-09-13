require('dotenv').config();
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { errorLogger, registerProcessLogging, requestLogger } = require('../logger');

const app = express();
registerProcessLogging();

app.use(cors({ origin: '*', methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'], credentials: true }));
app.post('/api/stripe-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  try {
    const paymentIntent = event.data.object;
    if (event.type === 'payment_intent.succeeded') {
      await supabase.from('bookings').update({ status: 'paid', payment_status: 'paid' })
        .eq('stripe_payment_intent_id', paymentIntent.id);
    } else if (event.type === 'payment_intent.payment_failed' || event.type === 'payment_intent.canceled') {
      await supabase.from('bookings').update({ status: 'pending', payment_status: event.type.endsWith('canceled') ? 'canceled' : 'failed' })
        .eq('stripe_payment_intent_id', paymentIntent.id);
    }
    res.json({ received: true });
  } catch (error) {
    errorLogger(error);
    res.status(500).json({ message: 'Webhook processing failed.' });
  }
});
app.use(express.json());
app.use(requestLogger);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { db: { schema: 'public' }, auth: { persistSession: false } }
);

// ── AUTH MIDDLEWARE ───────────────────────────────────────
async function requireAuth(req, res, next) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'Not authenticated.' });
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return res.status(401).json({ message: 'Invalid or expired session.' });
  req.user = user;
  next();
}

function requireAdmin(req, res, next) {
  if (!process.env.ADMIN_PASSWORD || req.headers['x-admin-password'] !== process.env.ADMIN_PASSWORD)
    return res.status(401).json({ message: 'Admin access required.' });
  next();
}

async function requireHost(req, res, next) {
  await requireAuth(req, res, async () => {
    try {
      const { data } = await supabase.from('profiles').select('role').eq('id', req.user.id).single();
      if (!data || !['host','admin'].includes(data.role))
        return res.status(403).json({ message: 'Host access required.' });
      req.role = data.role;
      next();
    } catch (error) {
      const message = error?.message || 'Database setup incomplete.';
      if (String(message).includes('profiles') || String(message).includes('schema cache')) {
        return res.status(500).json({
          message: 'Database setup incomplete: please run the SQL in backend/supabase_setup.sql to create the public.profiles table.'
        });
      }
      return res.status(500).json({ message });
    }
  });
}

// ── HEALTH ────────────────────────────────────────────────
app.get('/', (req, res) => res.json({
  status: 'ok',
  service: 'manuman-backend',
  message: 'API is running. Use /api/health or /api/ping for status checks.',
  routes: ['/api/health', '/api/ping', '/api/fleet', '/api/bookings']
}));
app.get('/api', (req, res) => res.json({
  status: 'ok',
  service: 'manuman-backend',
  message: 'API is running. Use /api/health or /api/ping for status checks.',
  routes: ['/api/health', '/api/ping', '/api/fleet', '/api/bookings']
}));
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.get('/api/ping', (req, res) => res.json({ status: 'ok', ok: true, service: 'manuman-backend' }));

async function calculateBookingTotal({ vehicle, pickup, pickupDate, returnDate }) {
  const { data: car, error } = await supabase.from('fleet').select('id, year, make, model, price, available, approved').eq('id', vehicle).single();
  if (error || !car || car.available === false || car.approved === false) throw new Error('This vehicle is not available.');
  if (!Number.isFinite(Number(car.price)) || Number(car.price) <= 0) throw new Error('This vehicle does not have a valid rental price.');
  const start = new Date(`${pickupDate}T00:00:00Z`);
  const end = new Date(`${returnDate}T00:00:00Z`);
  const days = Math.ceil((end - start) / 86400000);
  if (!Number.isInteger(days) || days <= 0) throw new Error('Return date must be after pick-up date.');
  const base = days * Number(car.price);
  const discount = days > 7 ? Math.round(base * 0.1) : 0;
  const deliveryFee = pickup === 'Headquarters' ? 0 : 100;
  const total = base - discount + deliveryFee;
  if (total < 0.5) throw new Error('The booking total must be at least $0.50.');
  return { car, days, deliveryFee, total };
}

// ── STRIPE PAYMENT INTENT ─────────────────────────────────
app.post('/api/create-payment-intent', async (req, res) => {
  const { pickup, pickupDate, returnDate, vehicle, customerEmail, customerName, customerPhone, driverLicense, driverLicenseImage, termsAccepted, userId, idempotencyKey } = req.body;
  if (!pickup || !pickupDate || !returnDate || !vehicle || !customerName || !customerEmail || !driverLicense || !driverLicenseImage || termsAccepted !== true)
    return res.status(400).json({ message: 'Complete booking and identity details are required.' });
  const paymentKey = idempotencyKey || crypto.randomUUID();
  try {
    const { car, days, deliveryFee, total } = await calculateBookingTotal({ vehicle, pickup, pickupDate, returnDate });
    const { data: existing } = await supabase.from('bookings').select('id, stripe_payment_intent_id, total_amount').eq('payment_idempotency_key', paymentKey).maybeSingle();
    if (existing?.stripe_payment_intent_id) {
      const existingIntent = await stripe.paymentIntents.retrieve(existing.stripe_payment_intent_id);
      return res.json({ clientSecret: existingIntent.client_secret, bookingId: existing.id, totalAmount: existing.total_amount });
    }
    let booking = existing;
    if (!booking) {
      const { data: createdBooking, error: bookingError } = await supabase.from('bookings').insert([{
        user_id: userId || null, pickup, pickup_date: pickupDate, return_date: returnDate,
        vehicle_id: vehicle, vehicle_name: `${car.year} ${car.make} ${car.model}`,
        customer_name: customerName, customer_email: customerEmail, customer_phone: customerPhone || '',
        driver_license: driverLicense, driver_license_image: driverLicenseImage, terms_accepted: true,
        payment_method: 'card', total_amount: total, delivery_fee: deliveryFee,
        status: 'payment_pending', payment_status: 'unpaid', payment_idempotency_key: paymentKey
      }]).select('id').single();
      if (bookingError) throw bookingError;
      booking = createdBooking;
    }
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(total * 100),
      currency: 'usd',
      receipt_email: customerEmail,
      description: `${car.year} ${car.make} ${car.model} rental`,
      metadata: { bookingId: booking.id, customerName },
    }, { idempotencyKey: paymentKey });
    const { error: intentError } = await supabase.from('bookings').update({ stripe_payment_intent_id: paymentIntent.id }).eq('id', booking.id);
    if (intentError) throw intentError;
    res.json({ clientSecret: paymentIntent.client_secret, bookingId: booking.id, totalAmount: total, days });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/confirm-payment', async (req, res) => {
  const { paymentIntentId } = req.body;
  if (!paymentIntentId) return res.status(400).json({ message: 'Payment intent is required.' });
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (paymentIntent.status !== 'succeeded') return res.status(409).json({ message: 'Payment has not succeeded.' });
    const { data, error } = await supabase.from('bookings').update({ status: 'paid', payment_status: 'paid' })
      .eq('stripe_payment_intent_id', paymentIntent.id).select().single();
    if (error || !data) return res.status(500).json({ message: error?.message || 'Booking could not be finalized.' });
    res.json({ booking: data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ── ADMIN AUTH ────────────────────────────────────────────
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (password === process.env.ADMIN_PASSWORD) return res.json({ success: true });
  res.status(401).json({ success: false, message: 'Wrong password' });
});

// ── IMAGE UPLOAD ──────────────────────────────────────────
// Raw binary handler (web admin sends file directly)
app.post('/api/upload', (req, res, next) => {
  const ct = req.headers['content-type'] || '';
  if (ct.startsWith('image/')) {
    express.raw({ type: 'image/*', limit: '10mb' })(req, res, next);
  } else {
    next();
  }
}, async (req, res) => {
  try {
    const bucketName = 'car-images';
    let buffer, ct;

    const contentType = req.headers['content-type'] || '';
    if (contentType.startsWith('image/')) {
      // Raw binary from web admin
      buffer = req.body;
      ct = contentType;
    } else if (req.body && req.body.image) {
      // JSON base64 from mobile app
      buffer = Buffer.from(req.body.image, 'base64');
      ct = req.body.contentType || 'image/jpeg';
    } else {
      return res.status(400).json({ message: 'No image provided.' });
    }

    if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
      return res.status(400).json({ message: 'Invalid image data.' });
    }

    const ext = ct.split('/')[1]?.split(';')[0] || 'jpeg';
    const filename = `${bucketName}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from(bucketName).upload(filename, buffer, { contentType: ct, upsert: true });
    if (error) return res.status(500).json({ message: error.message });
    const { data } = supabase.storage.from(bucketName).getPublicUrl(filename);
    res.json({ url: data.publicUrl });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// ── USER PROFILE ──────────────────────────────────────────
app.get('/api/profile', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', req.user.id).single();
    if (error) {
      if (String(error.message).includes('profiles') || String(error.message).includes('schema cache')) {
        return res.status(500).json({
          message: 'Database setup incomplete: please run the SQL in backend/supabase_setup.sql to create the public.profiles table.'
        });
      }
      return res.status(500).json({ message: error.message });
    }
    res.json(data);
  } catch (error) {
    const message = error?.message || 'Database setup incomplete.';
    if (String(message).includes('profiles') || String(message).includes('schema cache')) {
      return res.status(500).json({
        message: 'Database setup incomplete: please run the SQL in backend/supabase_setup.sql to create the public.profiles table.'
      });
    }
    return res.status(500).json({ message });
  }
});

app.patch('/api/profile', requireAuth, async (req, res) => {
  try {
    const { full_name, phone } = req.body;
    const { data, error } = await supabase.from('profiles').update({ full_name, phone }).eq('id', req.user.id).select().single();
    if (error) {
      if (String(error.message).includes('profiles') || String(error.message).includes('schema cache')) {
        return res.status(500).json({
          message: 'Database setup incomplete: please run the SQL in backend/supabase_setup.sql to create the public.profiles table.'
        });
      }
      return res.status(500).json({ message: error.message });
    }
    res.json(data);
  } catch (error) {
    const message = error?.message || 'Database setup incomplete.';
    if (String(message).includes('profiles') || String(message).includes('schema cache')) {
      return res.status(500).json({
        message: 'Database setup incomplete: please run the SQL in backend/supabase_setup.sql to create the public.profiles table.'
      });
    }
    return res.status(500).json({ message });
  }
});

// Apply to become a host
app.post('/api/become-host', requireAuth, async (req, res) => {
  try {
    const { driverLicense, phone, location, termsAccepted } = req.body;
    if (!driverLicense || !phone || !location || termsAccepted !== true) {
      return res.status(400).json({ message: 'Driver license number, phone number, location, and host policy agreement are required.' });
    }
    const { data: profile, error: profileError } = await supabase.from('profiles').upsert({
      id: req.user.id,
      full_name: req.user.user_metadata?.full_name || req.user.email?.split('@')[0] || '',
      role: 'customer'
    }, { onConflict: 'id' }).select().single();
    if (profileError) {
      if (String(profileError.message).includes('profiles') || String(profileError.message).includes('schema cache')) {
        return res.status(500).json({
          message: 'Database setup incomplete: please run the SQL in backend/supabase_setup.sql to create the public.profiles table.'
        });
      }
      return res.status(500).json({ message: profileError.message });
    }

    if (['host', 'admin'].includes(profile.role)) {
      return res.json({ message: 'You already have host access.', profile });
    }
    const { data: existing } = await supabase.from('host_requests')
      .select('*').eq('user_id', req.user.id).eq('status', 'pending').maybeSingle();
    if (existing) return res.json({ message: 'Your host application is already pending admin review.', request: existing });
    const { data, error } = await supabase.from('host_requests')
      .insert({
        user_id: req.user.id,
        email: req.user.email || '',
        driver_license: driverLicense.trim(),
        phone: phone.trim(),
        location: location.trim(),
        terms_accepted: true,
        terms_version: 'host-v1',
        status: 'pending'
      }).select().single();
    if (error) return res.status(500).json({ message: error.message });
    res.status(201).json({ message: 'Your host application was sent for admin review.', request: data });
  } catch (error) {
    const message = error?.message || 'Database setup incomplete.';
    if (String(message).includes('profiles') || String(message).includes('schema cache')) {
      return res.status(500).json({
        message: 'Database setup incomplete: please run the SQL in backend/supabase_setup.sql to create the public.profiles table.'
      });
    }
    return res.status(500).json({ message });
  }
});

app.get('/api/host-request', requireAuth, async (req, res) => {
  const { data, error } = await supabase.from('host_requests').select('*')
    .eq('user_id', req.user.id).order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (error) return res.status(500).json({ message: error.message });
  res.json(data || { status: 'none' });
});

app.get('/api/host-requests', requireAdmin, async (req, res) => {
  const { data, error } = await supabase.from('host_requests')
    .select('*, profiles(id, full_name, role)').eq('status', 'pending').order('created_at');
  if (error) return res.status(500).json({ message: error.message });
  res.json(data);
});

app.patch('/api/host-requests/:id/approve', requireAdmin, async (req, res) => {
  const { data: request, error: requestError } = await supabase.from('host_requests')
    .update({ status: 'approved', reviewed_at: new Date().toISOString() })
    .eq('id', req.params.id).eq('status', 'pending').select().single();
  if (requestError) return res.status(500).json({ message: requestError.message });
  const { data: profile, error: profileError } = await supabase.from('profiles')
    .update({ role: 'host' }).eq('id', request.user_id).select().single();
  if (profileError) return res.status(500).json({ message: profileError.message });
  res.json({ request, profile });
});

app.patch('/api/host-requests/:id/reject', requireAdmin, async (req, res) => {
  const { data, error } = await supabase.from('host_requests')
    .update({ status: 'rejected', reviewed_at: new Date().toISOString() })
    .eq('id', req.params.id).eq('status', 'pending').select().single();
  if (error) return res.status(500).json({ message: error.message });
  res.json(data);
});

// ── FLEET ─────────────────────────────────────────────────
app.get('/api/fleet', async (req, res) => {
  let query = supabase.from('fleet').select('*').order('created_at');
  // Only filter by approved if the column exists (new schema)
  const { data, error } = await query;
  if (error) return res.status(500).json({ message: error.message });
  // Filter approved if column present
  const filtered = data[0] && 'approved' in data[0] ? data.filter(c => c.approved) : data;
  res.json(filtered);
});

app.get('/api/fleet/pending', async (req, res) => {
  const { data, error } = await supabase.from('fleet').select('*').eq('approved', false).order('created_at');
  if (error) return res.status(500).json({ message: error.message });
  res.json(data);
});

async function fleetWrite(operation, payload) {
  let values = { ...payload };
  for (const optionalField of ['interior_images', 'approved']) {
    const result = await operation(values);
    if (!result.error || !result.error.message.includes(optionalField)) return result;
    delete values[optionalField];
  }
  return operation(values);
}

app.post('/api/fleet', async (req, res) => {
  const { year, make, model, category, price, image_url, features, interior_images } = req.body;
  if (!year || !make || !model || !category || !price)
    return res.status(400).json({ message: 'year, make, model, category and price are required.' });
  const payload = { year, make, model, category, price: Number(price), image_url: image_url || '', features: features || [], interior_images: interior_images || [], available: true, approved: true };
  const { data, error } = await fleetWrite(
    values => supabase.from('fleet').insert([values]).select().single(),
    payload
  );
  if (error) return res.status(500).json({ message: error.message });
  res.status(201).json(data);
});

app.put('/api/fleet/:id', async (req, res) => {
  const { year, make, model, category, price, image_url, features, available, interior_images } = req.body;
  const payload = { year, make, model, category, price: Number(price), image_url, features, available, interior_images: interior_images || [] };
  const { data, error } = await fleetWrite(
    values => supabase.from('fleet').update(values).eq('id', req.params.id).select().single(),
    payload
  );
  if (error) return res.status(500).json({ message: error.message });
  res.json(data);
});

app.delete('/api/fleet/:id', async (req, res) => {
  const { error } = await supabase.from('fleet').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ message: error.message });
  res.json({ message: 'Car deleted' });
});

// ── HOST ROUTES ───────────────────────────────────────────
// Host lists their own cars
app.get('/api/host/fleet', requireHost, async (req, res) => {
  const { data, error } = await supabase.from('fleet').select('*').eq('host_id', req.user.id).order('created_at');
  if (error) return res.status(500).json({ message: error.message });
  res.json(data);
});

// Host adds a car (pending approval)
app.post('/api/host/fleet', requireHost, async (req, res) => {
  const { year, make, model, category, price, image_url, features } = req.body;
  if (!year || !make || !model || !category || !price)
    return res.status(400).json({ message: 'All fields required.' });
  const { data, error } = await supabase.from('fleet').insert([{
    host_id: req.user.id, year, make, model, category,
    price: Number(price), image_url: image_url || '',
    features: features || [], available: true, approved: false
  }]).select().single();
  if (error) return res.status(500).json({ message: error.message });
  res.status(201).json(data);
});

// Host updates their car
app.put('/api/host/fleet/:id', requireHost, async (req, res) => {
  const { year, make, model, category, price, image_url, features, available } = req.body;
  const { data, error } = await supabase.from('fleet')
    .update({ year, make, model, category, price: Number(price), image_url, features, available })
    .eq('id', req.params.id).eq('host_id', req.user.id).select().single();
  if (error) return res.status(500).json({ message: error.message });
  res.json(data);
});

// Host deletes their car
app.delete('/api/host/fleet/:id', requireHost, async (req, res) => {
  const { error } = await supabase.from('fleet').delete().eq('id', req.params.id).eq('host_id', req.user.id);
  if (error) return res.status(500).json({ message: error.message });
  res.json({ message: 'Car deleted' });
});

// Host sees bookings on their cars
app.get('/api/host/bookings', requireHost, async (req, res) => {
  const { data: cars } = await supabase.from('fleet').select('id').eq('host_id', req.user.id);
  if (!cars || cars.length === 0) return res.json([]);
  const ids = cars.map(c => c.id);
  const { data, error } = await supabase.from('bookings').select('*').in('vehicle_id', ids).order('created_at', { ascending: false });
  if (error) return res.status(500).json({ message: error.message });
  res.json(data);
});

// Admin approves a car listing
app.patch('/api/fleet/:id/approve', async (req, res) => {
  const { data, error } = await supabase.from('fleet').update({ approved: true }).eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ message: error.message });
  res.json(data);
});

// ── BOOKINGS ──────────────────────────────────────────────
app.post('/api/bookings', async (req, res) => {
  const { pickup, pickupDate, returnDate, vehicle, vehicleName, customerName, customerEmail, customerPhone, paymentMethod, totalAmount, deliveryFee, userId, driverLicense, driverLicenseImage, termsAccepted } = req.body;
  const normalizedLicense = (driverLicense || '').trim();
  const normalizedLicenseImage = (driverLicenseImage || '').trim();
  const normalizedTerms = termsAccepted === true || termsAccepted === 'true';
  if (!pickup || !pickupDate || !returnDate || !vehicle)
    return res.status(400).json({ message: 'All fields are required.' });
  if (!normalizedLicense)
    return res.status(400).json({ message: "Driver's license or ID number is required before booking." });
  if (!normalizedLicenseImage)
    return res.status(400).json({ message: "A clear driver's license photo is required before booking." });
  if (!normalizedTerms)
    return res.status(400).json({ message: 'You must agree to the Terms & Conditions before booking.' });
  if (returnDate <= pickupDate)
    return res.status(400).json({ message: 'Return date must be after pick-up date.' });
  const { data, error } = await supabase.from('bookings').insert([{
    user_id: userId || null,
    pickup, pickup_date: pickupDate, return_date: returnDate,
    vehicle_id: vehicle, vehicle_name: vehicleName || vehicle,
    customer_name: customerName || '', customer_email: customerEmail || '',
    customer_phone: customerPhone || '', payment_method: paymentMethod || 'cash',
    total_amount: totalAmount || 0, delivery_fee: deliveryFee || 0,
    driver_license: normalizedLicense,
    driver_license_image: normalizedLicenseImage,
    terms_accepted: normalizedTerms,
    status: paymentMethod === 'card' ? 'paid' : 'pending'
  }]).select().single();
  if (error) return res.status(500).json({ message: error.message });
  res.status(201).json({ message: 'Booking created', booking: data });
});

app.get('/api/bookings/availability/:carId', async (req, res) => {
  const { data, error } = await supabase.from('bookings')
    .select('pickup_date, return_date').eq('vehicle_id', req.params.carId).not('status', 'eq', 'cancelled');
  if (error) return res.status(500).json({ message: error.message });
  res.json(data);
});

// User's own bookings
app.get('/api/bookings/mine', requireAuth, async (req, res) => {
  const { data, error } = await supabase.from('bookings').select('*').eq('user_id', req.user.id).order('created_at', { ascending: false });
  if (error) return res.status(500).json({ message: error.message });
  res.json(data);
});

app.get('/api/bookings', async (req, res) => {
  const { data, error } = await supabase.from('bookings').select('*').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ message: error.message });
  res.json(data);
});

app.patch('/api/bookings/:id', async (req, res) => {
  const { data, error } = await supabase.from('bookings').update({ status: req.body.status }).eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ message: error.message });
  res.json(data);
});

app.delete('/api/bookings/:id', async (req, res) => {
  const { error } = await supabase.from('bookings').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ message: error.message });
  res.json({ message: 'Booking deleted' });
});

// ── RATINGS ───────────────────────────────────────────────
app.post('/api/ratings', async (req, res) => {
  const { name, rating, comment } = req.body;
  const numericRating = Number(rating);
  if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5)
    return res.status(400).json({ message: 'Rating must be a whole number from 1 to 5.' });
  const { data, error } = await supabase.from('ratings').insert([{ name: name || 'Anonymous', rating: numericRating, comment: comment || '' }]).select().single();
  if (error) return res.status(500).json({ message: error.message });
  res.status(201).json({ message: 'Rating submitted', rating: data });
});

app.get('/api/ratings', async (req, res) => {
  const { data, error } = await supabase.from('ratings').select('*').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ message: error.message });
  res.json(data);
});

app.delete('/api/ratings/:id', async (req, res) => {
  const { error } = await supabase.from('ratings').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ message: error.message });
  res.json({ message: 'Rating deleted' });
});

// ── CONTACTS ──────────────────────────────────────────────
app.post('/api/contact', async (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message)
    return res.status(400).json({ message: 'Name, email, and message are required.' });
  const { data, error } = await supabase.from('contacts').insert([{ name, email, phone: req.body.phone || '', message }]).select().single();
  if (error) return res.status(500).json({ message: error.message });
  res.status(201).json({ message: 'Message received', contact: data });
});

app.get('/api/contacts', async (req, res) => {
  const { data, error } = await supabase.from('contacts').select('*').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ message: error.message });
  res.json(data);
});

app.delete('/api/contacts/:id', async (req, res) => {
  const { error } = await supabase.from('contacts').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ message: error.message });
  res.json({ message: 'Contact deleted' });
});

app.use(errorLogger);

module.exports = app;
