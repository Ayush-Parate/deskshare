
const Booking = require("../models/Booking");
const Space = require("../models/Space");
const { hasBookingConflict } = require("../utils/conflictChecker");

exports.createBooking = async (req, res, next) => {
  try {
    const { spaceId, startTime, endTime, notes = "" } = req.body;

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start >= end) {
      return res.status(400).json({ success: false, message: "Valid startTime and endTime are required" });
    }

    if (start < new Date()) {
      return res.status(400).json({ success: false, message: "Booking cannot start in the past" });
    }

    const space = await Space.findById(spaceId);
    if (!space || !space.available) {
      return res.status(404).json({ success: false, message: "Space not found or unavailable" });
    }

    const conflict = await hasBookingConflict(spaceId, start, end);
    if (conflict) {
      return res.status(409).json({
        success: false,
        message: "Space is already booked for the selected time."
      });
    }

    const hours = (end - start) / (1000 * 60 * 60);
    const totalAmount = Number((hours * space.pricePerHour).toFixed(2));

    const booking = await Booking.create({
      user: req.user._id,
      space: space._id,
      startTime: start,
      endTime: end,
      notes,
      totalAmount
    });

    const populated = await booking.populate([
      { path: "user", select: "name email" },
      { path: "space", select: "name type location pricePerHour" }
    ]);

    res.status(201).json({
      success: true,
      message: "Booking created successfully",
      data: populated
    });
  } catch (error) {
    next(error);
  }
};

exports.getBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("user", "name email")
      .populate("space", "name type location pricePerHour");

    if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });

    if (booking.user._id.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "You cannot view this booking" });
    }

    res.json({ success: true, data: booking });
  } catch (error) {
    next(error);
  }
};

exports.cancelBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });

    if (booking.user.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "You cannot cancel this booking" });
    }

    booking.status = "cancelled";
    await booking.save();

    res.json({ success: true, message: "Booking cancelled", data: booking });
  } catch (error) {
    next(error);
  }
};
