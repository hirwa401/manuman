require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
app.use(cors({
  origin: [
    'http://localhost:5500',
    'http://localhost:50006',
    'http://127.0.0.1:5500',
    /\.vercel\.app$/
  ],
  methods: ['GET','POST','PUT','PATCH','DELETE'],
  credentials: true
}));
app.use(express.json());

// ── SUPABASE CLIENT ───────────────────────────────────────
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { db: { schema: 'public' }, auth: { persistSession: false } }
);

// ── HEALTH CHECK ──────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// ── STRIPE PAYMENT INTENT ─────────────────────────────────
app.post('/api/create-payment-intent', async (req, res) => {
  const { amount, customerEmail, customerName, description } = req.body;
  if (!amount || amount <= 0) return res.status(400).json({ message: 'Invalid amount.' });
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // cents
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
  if (password === process.env.ADMIN_PASSWORD)
    return res.json({ success: true });
  res.status(401).json({ success: false, message: 'Wrong password' });
});

// ── FLEET ─────────────────────────────────────────────────
app.get('/api/fleet', async (req, res) => {
  const { data, error } = await supabase.from('fleet').select('*').order('created_at');
  if (error) return res.status(500).json({ message: error.message });
  res.json(data);
});

app.post('/api/fleet', async (req, res) => {
  const { year, make, model, category, price, image_url, features } = req.body;
  if (!year || !make || !model || !category || !price)
    return res.status(400).json({ message: 'year, make, model, category and price are required.' });
  const { data, error } = await supabase.from('fleet').insert([{ year, make, model, category, price: Number(price), image_url: image_url || '', features: features || [], available: true }]).select().single();
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

// ── BOOKINGS ──────────────────────────────────────────────
app.post('/api/bookings', async (req, res) => {
  const { pickup, pickupDate, returnDate, vehicle, vehicleName, customerName, customerEmail, customerPhone, paymentMethod, totalAmount } = req.body;
  if (!pickup || !pickupDate || !returnDate || !vehicle)
    return res.status(400).json({ message: 'All fields are required.' });
  if (returnDate <= pickupDate)
    return res.status(400).json({ message: 'Return date must be after pick-up date.' });
  const { data, error } = await supabase.from('bookings').insert([{
    pickup, pickup_date: pickupDate, return_date: returnDate,
    vehicle_id: vehicle, vehicle_name: vehicleName || vehicle,
    customer_name: customerName || '', customer_email: customerEmail || '',
    customer_phone: customerPhone || '', payment_method: paymentMethod || 'cash',
    total_amount: totalAmount || 0,
    status: paymentMethod === 'card' ? 'paid' : 'pending'
  }]).select().single();
  if (error) return res.status(500).json({ message: error.message });
  res.status(201).json({ message: 'Booking created', booking: data });
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
