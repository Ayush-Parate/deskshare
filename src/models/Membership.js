const mongoose = require('mongoose');

// Plan catalogue (kept in code for simplicity)
const PLANS = {
  basic:   { price: 999,  discountPercent: 10, durationDays: 30 },
  pro:     { price: 1999, discountPercent: 20, durationDays: 30 },
  premium: { price: 3499, discountPercent: 30, durationDays: 30 },
};

const membershipSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  plan: { type: String, enum: Object.keys(PLANS), required: true },
  price: { type: Number, required: true },
  discountPercent: { type: Number, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: { type: String, enum: ['active', 'expired'], default: 'active' },
}, { timestamps: true });

module.exports = mongoose.model('Membership', membershipSchema);
module.exports.PLANS = PLANS;
