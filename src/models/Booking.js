const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  space: { type: mongoose.Schema.Types.ObjectId, ref: 'Space', required: true },
  start: { type: Date, required: true },
  end: { type: Date, required: true },
  seats: { type: Number, default: 1, min: 1 },
  totalPrice: { type: Number, required: true },
  discountPercent: { type: Number, default: 0 },
  status: { type: String, enum: ['confirmed', 'cancelled'], default: 'confirmed' },
}, { timestamps: true });

bookingSchema.index({ space: 1, start: 1, end: 1 });
module.exports = mongoose.model('Booking', bookingSchema);
