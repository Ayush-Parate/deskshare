const Membership = require('../models/Membership');
const { PLANS } = Membership;
const asyncHandler = require('../utils/asyncHandler');

// GET /api/memberships/plans
exports.listPlans = (req, res) => res.json(PLANS);

// POST /api/memberships  { plan: "basic" | "pro" | "premium" }
// (Payment gateway integration is out of scope; purchase is recorded directly.)
exports.purchase = asyncHandler(async (req, res) => {
  const plan = PLANS[req.body.plan];
  const now = new Date();
  const active = await Membership.findOne({ user: req.user._id, status: 'active', endDate: { $gte: now } });
  if (active) return res.status(409).json({ message: 'You already have an active membership' });
  const membership = await Membership.create({
    user: req.user._id, plan: req.body.plan, price: plan.price, discountPercent: plan.discountPercent,
    startDate: now, endDate: new Date(now.getTime() + plan.durationDays * 864e5),
  });
  res.status(201).json(membership);
});

// GET /api/memberships/user/:id
exports.getUserMemberships = asyncHandler(async (req, res) => {
  if (req.params.id !== req.user._id.toString() && req.user.role !== 'admin')
    return res.status(403).json({ message: 'Not allowed' });
  await Membership.updateMany({ user: req.params.id, status: 'active', endDate: { $lt: new Date() } }, { status: 'expired' });
  res.json(await Membership.find({ user: req.params.id }).sort('-createdAt'));
});
