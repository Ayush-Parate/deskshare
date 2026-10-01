
const Booking = require("../models/Booking");

async function hasBookingConflict(spaceId, startTime, endTime, ignoreBookingId = null) {
  const query = {
    space: spaceId,
    status: "confirmed",
    startTime: { $lt: endTime },
    endTime: { $gt: startTime }
  };

  if (ignoreBookingId) {
    query._id = { $ne: ignoreBookingId };
  }

  const conflict = await Booking.findOne(query);
  return Boolean(conflict);
}

module.exports = { hasBookingConflict };
