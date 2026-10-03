const jwt = require('jsonwebtoken');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

exports.protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return res.status(401).json({ message: 'Not authenticated' });
  let decoded;
  try {
    decoded = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
  const user = await User.findById(decoded.id);
  if (!user) return res.status(401).json({ message: 'User no longer exists' });
  req.user = user;
  next();
});

exports.authorize = (...roles) => (req, res, next) =>
  roles.includes(req.user.role) ? next() : res.status(403).json({ message: 'Forbidden for your role' });
