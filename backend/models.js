const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  pickup: { type: String, required: true },
  pickupDate: { type: String, required: true },
  returnDate: { type: String, required: true },
  vehicle: { type: String, required: true },
  status: { type: String, default: 'pending' }
}, { timestamps: true });

const contactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: String,
  message: { type: String, required: true }
}, { timestamps: true });

module.exports = {
  Booking: mongoose.model('Booking', bookingSchema),
  Contact: mongoose.model('Contact', contactSchema)
};
