
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { initializeFirebase } = require("../config/firebase");

async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    if (!header.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Authorization token required" });
    }

    const token = header.substring(7);

    // First try application JWT.
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      if (!user) return res.status(401).json({ success: false, message: "User not found" });
      req.user = user;
      req.authType = "jwt";
      return next();
    } catch (_) {
      // If it is not our JWT, try Firebase ID token.
    }

    const admin = initializeFirebase();
    if (!admin) {
      return res.status(401).json({ success: false, message: "Invalid JWT token" });
    }

    const decodedFirebase = await admin.auth().verifyIdToken(token);
    let user = await User.findOne({ firebaseUid: decodedFirebase.uid });

    if (!user && decodedFirebase.email) {
      user = await User.findOne({ email: decodedFirebase.email.toLowerCase() });
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Firebase user is authenticated but not registered in DeskShare"
      });
    }

    req.user = user;
    req.authType = "firebase";
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Authentication failed",
      error: error.message
    });
  }
}

// Like authenticate, but never rejects the request: if a valid token is present
// req.user is populated, otherwise the request continues as an anonymous one.
async function optionalAuth(req, res, next) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) return next();

  const token = header.substring(7);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (user) {
      req.user = user;
      req.authType = "jwt";
    }
    return next();
  } catch (_) {
    // Not an application JWT; fall through and try Firebase below.
  }

  try {
    const admin = initializeFirebase();
    if (admin) {
      const decodedFirebase = await admin.auth().verifyIdToken(token);
      let user = await User.findOne({ firebaseUid: decodedFirebase.uid });
      if (!user && decodedFirebase.email) {
        user = await User.findOne({ email: decodedFirebase.email.toLowerCase() });
      }
      if (user) {
        req.user = user;
        req.authType = "firebase";
      }
    }
  } catch (_) {
    // Ignore invalid/expired tokens for optional auth.
  }

  return next();
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    next();
  };
}

module.exports = { authenticate, optionalAuth, authorize };
