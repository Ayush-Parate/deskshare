
const mongoose = require("mongoose");

const spaceSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["desk", "meeting-room", "private-office", "conference-room", "hot-desk"],
      required: true
    },
    description: { type: String, default: "" },
    location: { type: String, required: true, trim: true },
    pricePerHour: { type: Number, required: true, min: 0 },
    capacity: { type: Number, required: true, min: 1 },
    amenities: [{ type: String, trim: true }],
    imageUrls: [{ type: String }],
    available: { type: Boolean, default: true }
  },
  { timestamps: true }
);

spaceSchema.index({ name: "text", description: "text", location: "text", type: "text" });

module.exports = mongoose.model("Space", spaceSchema);
