require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

const app = express();
app.use(cors());
app.use(express.json());

// ── JSON FILE DB ──────────────────────────────────────────
const DB_PATH = path.join(__dirname, 'db.json');

const DEFAULT_FLEET = [
  { _id: '1', year: '2022', make: 'Toyota', model: 'RAV4 Hybrid', category: 'SUV', price: 75, imageUrl: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=600&q=80', features: ['Fuel Efficient Hybrid','All-Wheel Drive (AWD)','Spacious & Comfortable','Ideal for All Seasons'], available: true },
  { _id: '2', year: '2017', make: 'Honda', model: 'Odyssey XL', category: 'MINIVAN', price: 85, imageUrl: 'https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=600&q=80', features: ['8-Passenger Seating','Power Sliding Doors','Tri-Zone Climate Control','Perfect for Family Trips'], available: true },
  { _id: '3', year: '2018', make: 'Chevrolet', model: 'Cruze', category: 'SEDAN', price: 55, imageUrl: 'images/cruze.jpeg', features: ['Great on Gas','Easy to Park','Smooth & Reliable','Perfect for Daily Use'], available: true }
];

function readDB() {
  if (!fs.existsSync(DB_PATH)) fs.writeFileSync(DB_PATH, JSON.stringify({ bookings: [], contacts: [], fleet: DEFAULT_FLEET }));
  const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
  if (!db.fleet) { db.fleet = DEFAULT_FLEET; writeDB(db); }
  return db;
}

function writeDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// ── ADMIN AUTH ────────────────────────────────────────────
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (password === process.env.ADMIN_PASSWORD)
    return res.json({ success: true });
  res.status(401).json({ success: false, message: 'Wrong password' });
});

// ── BOOKINGS ──────────────────────────────────────────────
app.post('/api/bookings', (req, res) => {
  const { pickup, pickupDate, returnDate, vehicle } = req.body;
  if (!pickup || !pickupDate || !returnDate || !vehicle)
    return res.status(400).json({ message: 'All fields are required.' });
  if (returnDate < pickupDate)
    return res.status(400).json({ message: 'Return date must be after pick-up date.' });

  const db = readDB();
  const booking = { _id: randomUUID(), pickup, pickupDate, returnDate, vehicle, status: 'pending', createdAt: new Date().toISOString() };
  db.bookings.unshift(booking);
  writeDB(db);
  res.status(201).json({ message: 'Booking created', booking });
});

app.get('/api/bookings', (req, res) => {
  res.json(readDB().bookings);
});

app.patch('/api/bookings/:id', (req, res) => {
  const db = readDB();
  const booking = db.bookings.find(b => b._id === req.params.id);
  if (!booking) return res.status(404).json({ message: 'Booking not found' });
  booking.status = req.body.status;
  writeDB(db);
  res.json(booking);
});

app.delete('/api/bookings/:id', (req, res) => {
  const db = readDB();
  db.bookings = db.bookings.filter(b => b._id !== req.params.id);
  writeDB(db);
  res.json({ message: 'Booking deleted' });
});

// ── FLEET ────────────────────────────────────────────────
app.get('/api/fleet', (req, res) => {
  res.json(readDB().fleet);
});

app.post('/api/fleet', (req, res) => {
  const { year, make, model, category, price, imageUrl, features } = req.body;
  if (!year || !make || !model || !category || !price)
    return res.status(400).json({ message: 'year, make, model, category and price are required.' });
  const db = readDB();
  const car = { _id: randomUUID(), year, make, model, category, price: Number(price), imageUrl: imageUrl || '', features: features || [], available: true };
  db.fleet.push(car);
  writeDB(db);
  res.status(201).json(car);
});

app.put('/api/fleet/:id', (req, res) => {
  const db = readDB();
  const idx = db.fleet.findIndex(c => c._id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Car not found' });
  db.fleet[idx] = { ...db.fleet[idx], ...req.body, _id: req.params.id };
  writeDB(db);
  res.json(db.fleet[idx]);
});

app.delete('/api/fleet/:id', (req, res) => {
  const db = readDB();
  db.fleet = db.fleet.filter(c => c._id !== req.params.id);
  writeDB(db);
  res.json({ message: 'Car deleted' });
});

// ── CONTACTS ──────────────────────────────────────────────
app.post('/api/contact', (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message)
    return res.status(400).json({ message: 'Name, email, and message are required.' });

  const db = readDB();
  const contact = { _id: randomUUID(), ...req.body, createdAt: new Date().toISOString() };
  db.contacts.unshift(contact);
  writeDB(db);
  res.status(201).json({ message: 'Message received', contact });
});

app.get('/api/contacts', (req, res) => {
  res.json(readDB().contacts);
});

app.delete('/api/contacts/:id', (req, res) => {
  const db = readDB();
  db.contacts = db.contacts.filter(c => c._id !== req.params.id);
  writeDB(db);
  res.json({ message: 'Contact deleted' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
