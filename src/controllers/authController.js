const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { admin, isFirebaseReady } = require('../config/firebase');
const asyncHandler = require('../utils/asyncHandler');

const sign = (user) => jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
const publicUser = (u) => ({ id: u._id, name: u.name, email: u.email, role: u.role });

// POST /api/auth/register  (optionally pass firebaseToken to link a Firebase Auth account)
exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, role, firebaseToken } = req.body;
  let firebaseUid;
  if (firebaseToken) {
    if (!isFirebaseReady()) return res.status(503).json({ message: 'Firebase Auth is not configured' });
    const decoded = await admin.auth().verifyIdToken(firebaseToken);
    if (decoded.email && decoded.email.toLowerCase() !== email.toLowerCase())
      return res.status(400).json({ message: 'Firebase token email does not match' });
    firebaseUid = decoded.uid;
  }
  if (await User.findOne({ email })) return res.status(409).json({ message: 'Email already registered' });
  const user = await User.create({ name, email, password, role: role === 'owner' ? 'owner' : 'user', firebaseUid });
  res.status(201).json({ token: sign(user), user: publicUser(user) });
});

// POST /api/auth/login  (email+password OR firebaseToken)
exports.login = asyncHandler(async (req, res) => {
  const { email, password, firebaseToken } = req.body;
  if (firebaseToken) {
    if (!isFirebaseReady()) return res.status(503).json({ message: 'Firebase Auth is not configured' });
    const decoded = await admin.auth().verifyIdToken(firebaseToken);
    let user = await User.findOne({ $or: [{ firebaseUid: decoded.uid }, { email: decoded.email }] });
    if (!user) user = await User.create({ name: decoded.name || decoded.email.split('@')[0], email: decoded.email, firebaseUid: decoded.uid });
    else if (!user.firebaseUid) { user.firebaseUid = decoded.uid; await user.save(); }
    return res.json({ token: sign(user), user: publicUser(user) });
  }
  const user = await User.findOne({ email }).select('+password');
  if (!user || !user.password || !(await user.matchPassword(password)))
    return res.status(401).json({ message: 'Invalid email or password' });
  res.json({ token: sign(user), user: publicUser(user) });
});
