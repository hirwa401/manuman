require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();

app.use(cors({ origin: '*', methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'], credentials: true }));
app.use(express.json());

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

async function requireHost(req, res, next) {
  await requireAuth(req, res, async () => {
    const { data } = await supabase.from('profiles').select('role').eq('id', req.user.id).single();
    if (!data || !['host','admin'].includes(data.role))
      return res.status(403).json({ message: 'Host access required.' });
    req.role = data.role;
    next();
  });
}

// ── HEALTH ────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// ── STRIPE PAYMENT INTENT ─────────────────────────────────
app.post('/api/create-payment-intent', async (req, res) => {
  const { amount, customerEmail, customerName, description } = req.body;
  if (!amount || amount <= 0) return res.status(400).json({ message: 'Invalid amount.' });
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'usd',
      receipt_email: customerEmail,
      description: description || 'ManuMan Mobility Rental',
      metadata: { customerName: customerName || '' }
    });
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── ADMIN AUTH ────────────────────────────────────────────
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (password === process.env.ADMIN_PASSWORD) return res.json({ success: true });
  res.status(401).json({ success: false, message: 'Wrong password' });
});

// ── IMAGE UPLOAD ──────────────────────────────────────────
app.post('/api/upload', async (req, res) => {
  const chunks = [];
  req.on('data', chunk => chunks.push(chunk));
  req.on('end', async () => {
    try {
      const buffer = Buffer.concat(chunks);
      const contentType = req.headers['content-type'] || 'image/jpeg';
      const ext = contentType.split('/')[1].split(';')[0];
      const filename = `car-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('car-images').upload(filename, buffer, { contentType, upsert: true });
      if (error) return res.status(500).json({ message: error.message });
      const { data } = supabase.storage.from('car-images').getPublicUrl(filename);
      res.json({ url: data.publicUrl });
    } catch (e) { res.status(500).json({ message: e.message }); }
  });
});

// ── USER PROFILE ──────────────────────────────────────────
app.get('/api/profile', requireAuth, async (req, res) => {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', req.user.id).single();
  if (error) return res.status(500).json({ message: error.message });
  res.json(data);
});

app.patch('/api/profile', requireAuth, async (req, res) => {
  const { full_name, phone } = req.body;
  const { data, error } = await supabase.from('profiles').update({ full_name, phone }).eq('id', req.user.id).select().single();
  if (error) return res.status(500).json({ message: error.message });
  res.json(data);
});

// Apply to become a host
app.post('/api/become-host', requireAuth, async (req, res) => {
  const { data, error } = await supabase.from('profiles').update({ role: 'host' }).eq('id', req.user.id).select().single();
  if (error) return res.status(500).json({ message: error.message });
  res.json({ message: 'You are now a host!', profile: data });
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

app.post('/api/fleet', async (req, res) => {
  const { year, make, model, category, price, image_url, features } = req.body;
  if (!year || !make || !model || !category || !price)
    return res.status(400).json({ message: 'year, make, model, category and price are required.' });
  const { data, error } = await supabase.from('fleet').insert([{ year, make, model, category, price: Number(price), image_url: image_url || '', features: features || [], available: true, approved: true }]).select().single();
  if (error) return res.status(500).json({ message: error.message });
  res.status(201).json(data);
});

app.put('/api/fleet/:id', async (req, res) => {
  const { year, make, model, category, price, image_url, features, available } = req.body;
  const { data, error } = await supabase.from('fleet').update({ year, make, model, category, price: Number(price), image_url, features, available }).eq('id', req.params.id).select().single();
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
  const { pickup, pickupDate, returnDate, vehicle, vehicleName, customerName, customerEmail, customerPhone, paymentMethod, totalAmount, deliveryFee, userId } = req.body;
  if (!pickup || !pickupDate || !returnDate || !vehicle)
    return res.status(400).json({ message: 'All fields are required.' });
  if (returnDate <= pickupDate)
    return res.status(400).json({ message: 'Return date must be after pick-up date.' });
  const { data, error } = await supabase.from('bookings').insert([{
    user_id: userId || null,
    pickup, pickup_date: pickupDate, return_date: returnDate,
    vehicle_id: vehicle, vehicle_name: vehicleName || vehicle,
    customer_name: customerName || '', customer_email: customerEmail || '',
    customer_phone: customerPhone || '', payment_method: paymentMethod || 'cash',
    total_amount: totalAmount || 0, delivery_fee: deliveryFee || 0,
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
  if (!rating) return res.status(400).json({ message: 'Rating is required.' });
  const { data, error } = await supabase.from('ratings').insert([{ name: name || 'Anonymous', rating: Number(rating), comment: comment || '' }]).select().single();
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

module.exports = app;
