
const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    space: { type: mongoose.Schema.Types.ObjectId, ref: "Space", required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    status: {
      type: String,
      enum: ["confirmed", "cancelled", "completed"],
      default: "confirmed"
    },
    notes: { type: String, default: "" },
    totalAmount: { type: Number, required: true, min: 0 }
  },
  { timestamps: true }
);

bookingSchema.index({ space: 1, startTime: 1, endTime: 1, status: 1 });
bookingSchema.index({ user: 1, startTime: -1 });

module.exports = mongoose.model("Booking", bookingSchema);
