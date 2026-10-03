
const Membership = require("../models/Membership");

const PLAN_PRICES = {
  basic: 999,
  premium: 1999,
  team: 4999
};

exports.createMembership = async (req, res, next) => {
  try {
    const { plan, startDate } = req.body;

    if (!PLAN_PRICES[plan]) {
      return res.status(400).json({ success: false, message: "Invalid membership plan" });
    }

    const start = startDate ? new Date(startDate) : new Date();
    if (Number.isNaN(start.getTime())) {
      return res.status(400).json({ success: false, message: "Invalid startDate" });
    }

    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);

    const membership = await Membership.create({
      user: req.user._id,
      plan,
      startDate: start,
      endDate: end,
      amount: PLAN_PRICES[plan]
    });

    res.status(201).json({
      success: true,
      message: "Membership purchased",
      data: membership
    });
  } catch (error) {
    next(error);
  }
};

exports.getUserMemberships = async (req, res, next) => {
  try {
    if (req.params.id !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "You cannot view this user's memberships" });
    }

    const memberships = await Membership.find({ user: req.params.id }).sort({ createdAt: -1 });
    res.json({ success: true, count: memberships.length, data: memberships });
  } catch (error) {
    next(error);
  }
};

exports.getMyMemberships = async (req, res, next) => {
  try {
    const memberships = await Membership.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, count: memberships.length, data: memberships });
  } catch (error) {
    next(error);
  }
};

