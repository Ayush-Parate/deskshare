const Space = require('../models/Space');
const Booking = require('../models/Booking');
const asyncHandler = require('../utils/asyncHandler');
const { toDate, dayOfWeek } = require('../utils/time');

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const parseMaybeJSON = (v) => { if (typeof v !== 'string') return v; try { return JSON.parse(v); } catch { return v; } };
const toArray = (v) => {
  if (v === undefined) return undefined;
  if (Array.isArray(v)) return v;
  if (typeof v === 'string' && v.trim().startsWith('[')) return parseMaybeJSON(v);
  return String(v).split(',').map(s => s.trim()).filter(Boolean);
};

// GET /api/spaces  ?city=&type=&minPrice=&maxPrice=&page=&limit=
exports.getSpaces = asyncHandler(async (req, res) => {
  const { city, type, minPrice, maxPrice } = req.query;
  const page = Math.max(+req.query.page || 1, 1);
  const limit = Math.min(+req.query.limit || 10, 50);
  const filter = { isActive: true };
  if (city) filter.city = new RegExp(`^${escapeRegex(city)}$`, 'i');
  if (type) filter.type = type;
  if (minPrice || maxPrice) filter.pricePerHour = { ...(minPrice && { $gte: +minPrice }), ...(maxPrice && { $lte: +maxPrice }) };
  const [spaces, total] = await Promise.all([
    Space.find(filter).sort('-createdAt').skip((page - 1) * limit).limit(limit),
    Space.countDocuments(filter),
  ]);
  res.json({ total, page, pages: Math.ceil(total / limit), spaces });
});

// GET /api/spaces/search?keyword=meeting-room&city=&date=&startTime=&endTime=
exports.searchSpaces = asyncHandler(async (req, res) => {
  const { keyword, city, date, startTime, endTime } = req.query;
  const filter = { isActive: true };
  if (keyword) {
    // "meeting-room" also matches "meeting room"
    const pattern = escapeRegex(keyword.trim()).replace(/-/g, '[-\\s]');
    const rx = new RegExp(pattern, 'i');
    filter.$or = [{ name: rx }, { description: rx }, { type: rx }, { city: rx }, { amenities: rx }];
  }
  if (city) filter.city = new RegExp(`^${escapeRegex(city)}$`, 'i');
  const spaces = await Space.find(filter).limit(50);

  // Optional availability filter by date/time
  if (date && startTime && endTime) {
    const start = toDate(date, startTime), end = toDate(date, endTime);
    const day = dayOfWeek(date);
    const result = [];
    for (const s of spaces) {
      const slot = s.availability.find(a => a.day === day);
      if (!slot || startTime < slot.open || endTime > slot.close) continue;
      const overlapping = await Booking.find({ space: s._id, status: 'confirmed', start: { $lt: end }, end: { $gt: start } });
      const used = overlapping.reduce((n, b) => n + b.seats, 0);
      if (used < s.capacity) result.push({ ...s.toObject(), seatsLeft: s.capacity - used });
    }
    return res.json({ count: result.length, spaces: result });
  }
  res.json({ count: spaces.length, spaces });
});

// GET /api/spaces/:id
exports.getSpace = asyncHandler(async (req, res) => {
  const space = await Space.findById(req.params.id).populate('owner', 'name email');
  if (!space) return res.status(404).json({ message: 'Space not found' });
  res.json(space);
});

// POST /api/spaces  (owner/admin, multipart with "images")
exports.createSpace = asyncHandler(async (req, res) => {
  const b = req.body;
  const space = await Space.create({
    owner: req.user._id, name: b.name, description: b.description, type: b.type, city: b.city, address: b.address,
    capacity: b.capacity, pricePerHour: b.pricePerHour,
    amenities: toArray(b.amenities), availability: parseMaybeJSON(b.availability) || [],
    images: req.imageUrls || [],
  });
  res.status(201).json(space);
});

// PUT /api/spaces/:id  (owner of the space or admin)
exports.updateSpace = asyncHandler(async (req, res) => {
  const space = await Space.findById(req.params.id);
  if (!space) return res.status(404).json({ message: 'Space not found' });
  if (space.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin')
    return res.status(403).json({ message: 'You do not own this space' });
  const b = req.body;
  ['name', 'description', 'type', 'city', 'address', 'capacity', 'pricePerHour', 'isActive'].forEach(k => { if (b[k] !== undefined) space[k] = b[k]; });
  if (b.amenities !== undefined) space.amenities = toArray(b.amenities);
  if (b.availability !== undefined) space.availability = parseMaybeJSON(b.availability);
  if (req.imageUrls && req.imageUrls.length) space.images.push(...req.imageUrls);
  await space.save();
  res.json(space);
});
