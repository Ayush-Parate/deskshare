const Booking = require('../models/Booking');
const Space = require('../models/Space');
const Membership = require('../models/Membership');
const asyncHandler = require('../utils/asyncHandler');
const { toDate, dayOfWeek } = require('../utils/time');

// POST /api/bookings  { space, date:"2026-10-05", startTime:"10:00", endTime:"12:00", seats }
exports.createBooking = asyncHandler(async (req, res) => {
  const { space: spaceId, date, startTime, endTime } = req.body;
  const seats = +req.body.seats || 1;
  const space = await Space.findById(spaceId);
  if (!space || !space.isActive) return res.status(404).json({ message: 'Space not found' });

  const start = toDate(date, startTime), end = toDate(date, endTime);
  if (isNaN(start) || isNaN(end) || end <= start) return res.status(400).json({ message: 'endTime must be after startTime' });
  if (start < new Date()) return res.status(400).json({ message: 'Cannot book in the past' });

  const slot = space.availability.find(a => a.day === dayOfWeek(date));
  if (!slot || startTime < slot.open || endTime > slot.close)
    return res.status(400).json({ message: 'Space is not open during the requested time' });
  if (seats > space.capacity) return res.status(400).json({ message: `Max capacity is ${space.capacity}` });

  const overlapping = await Booking.find({ space: space._id, status: 'confirmed', start: { $lt: end }, end: { $gt: start } });
  const used = overlapping.reduce((n, b) => n + b.seats, 0);
  if (used + seats > space.capacity)
    return res.status(409).json({ message: `Only ${space.capacity - used} seat(s) left for that slot` });

  const membership = await Membership.findOne({ user: req.user._id, status: 'active', endDate: { $gte: new Date() } });
  const discountPercent = membership ? membership.discountPercent : 0;
  const hours = (end - start) / 36e5;
  const gross = hours * space.pricePerHour * seats;
  const totalPrice = Math.round(gross * (1 - discountPercent / 100) * 100) / 100;

  const booking = await Booking.create({ user: req.user._id, space: space._id, start, end, seats, totalPrice, discountPercent });
  res.status(201).json(booking);
});

// GET /api/bookings/:id  (booking owner, space owner, or admin)
exports.getBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id).populate('space', 'name type city owner').populate('user', 'name email');
  if (!booking) return res.status(404).json({ message: 'Booking not found' });
  const uid = req.user._id.toString();
  const allowed = booking.user._id.toString() === uid || booking.space.owner.toString() === uid || req.user.role === 'admin';
  if (!allowed) return res.status(403).json({ message: 'Not allowed to view this booking' });
  res.json(booking);
});

// DELETE /api/bookings/:id  -> cancels the booking (soft delete, keeps history)
exports.cancelBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) return res.status(404).json({ message: 'Booking not found' });
  if (booking.user.toString() !== req.user._id.toString() && req.user.role !== 'admin')
    return res.status(403).json({ message: 'Not allowed to cancel this booking' });
  if (booking.status === 'cancelled') return res.status(400).json({ message: 'Already cancelled' });
  if (booking.start < new Date()) return res.status(400).json({ message: 'Cannot cancel a booking that has started' });
  booking.status = 'cancelled';
  await booking.save();
  res.json({ message: 'Booking cancelled', booking });
});
