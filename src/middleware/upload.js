const multer = require('multer');
const path = require('path');
const { admin, isFirebaseReady } = require('../config/firebase');

// Parse multipart in memory (max 5 images, 5 MB each, images only)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 5 },
  fileFilter: (req, file, cb) =>
    file.mimetype.startsWith('image/') ? cb(null, true) : cb(new Error('Only image files are allowed')),
});

// Pushes parsed files to Firebase Storage and sets req.imageUrls
const uploadToFirebase = async (req, res, next) => {
  req.imageUrls = [];
  if (!req.files || req.files.length === 0) return next();
  if (!isFirebaseReady()) return res.status(503).json({ message: 'Firebase Storage is not configured' });
  try {
    const bucket = admin.storage().bucket();
    for (const file of req.files) {
      const name = `spaces/${Date.now()}-${Math.round(Math.random() * 1e6)}${path.extname(file.originalname)}`;
      const ref = bucket.file(name);
      await ref.save(file.buffer, { contentType: file.mimetype, resumable: false });
      await ref.makePublic();
      req.imageUrls.push(`https://storage.googleapis.com/${bucket.name}/${name}`);
    }
    next();
  } catch (err) { next(err); }
};

module.exports = { uploadImages: [upload.array('images', 5), uploadToFirebase] };
