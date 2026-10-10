
const fs = require("fs/promises");
const path = require("path");
const { initializeFirebase } = require("../config/firebase");

const LOCAL_UPLOAD_DIR = path.join(__dirname, "..", "public", "uploads");

function safeFileName(originalName) {
  const base = (originalName || "upload").replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${Date.now()}-${Math.round(Math.random() * 1e9)}-${base}`;
}

// Fallback used when Firebase Storage is unavailable: persist the file under
// public/uploads so it is served by the static middleware at /uploads/<file>.
async function saveLocally(file) {
  await fs.mkdir(LOCAL_UPLOAD_DIR, { recursive: true });
  const fileName = safeFileName(file.originalname);
  await fs.writeFile(path.join(LOCAL_UPLOAD_DIR, fileName), file.buffer);
  return `/uploads/${fileName}`;
}

async function saveToFirebase(file) {
  const admin = initializeFirebase();
  if (!admin) throw new Error("Firebase is not configured");

  const bucket = admin.storage().bucket();
  const fileName = `spaces/${safeFileName(file.originalname)}`;
  const storageFile = bucket.file(fileName);

  await storageFile.save(file.buffer, {
    metadata: { contentType: file.mimetype, metadata: { firebaseStorageDownloadTokens: fileName } },
    resumable: false
  });

  // The bucket may be configured as public or served through signed URLs.
  try {
    await storageFile.makePublic();
    return `https://storage.googleapis.com/${bucket.name}/${encodeURIComponent(fileName)}`;
  } catch (_) {
    const [url] = await storageFile.getSignedUrl({
      action: "read",
      expires: "03-09-2491"
    });
    return url;
  }
}

// Uploads an image to Firebase Storage, transparently falling back to local
// disk storage when Firebase is not configured or the upload fails.
async function uploadImage(file) {
  try {
    return await saveToFirebase(file);
  } catch (error) {
    console.warn(`Firebase upload failed (${error.message}); storing image locally.`);
    return saveLocally(file);
  }
}

module.exports = { uploadImage, saveLocally };
