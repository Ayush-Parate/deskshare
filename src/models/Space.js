const mongoose = require('mongoose');

const availabilitySchema = new mongoose.Schema({
  day: { type: Number, min: 0, max: 6, required: true }, // 0 = Sunday
  open: { type: String, required: true },  // "09:00"
  close: { type: String, required: true }, // "18:00"
}, { _id: false });

const spaceSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  type: { type: String, enum: ['desk', 'meeting-room', 'private-office'], required: true },
  city: { type: String, required: true, trim: true },
  address: { type: String, default: '' },
  capacity: { type: Number, required: true, min: 1 }, // seats / desks available at once
  pricePerHour: { type: Number, required: true, min: 0 },
  amenities: [String],
  images: [String],
  availability: [availabilitySchema],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Space', spaceSchema);
