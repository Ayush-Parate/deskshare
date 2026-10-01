
const mongoose = require("mongoose");

const membershipSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    plan: {
      type: String,
      enum: ["basic", "premium", "team"],
      required: true
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    amount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["active", "expired", "cancelled"],
      default: "active"
    }
  },
  { timestamps: true }
);

membershipSchema.index({ user: 1, status: 1, endDate: -1 });

module.exports = mongoose.model("Membership", membershipSchema);
