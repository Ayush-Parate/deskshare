
const { initializeFirebase } = require("../config/firebase");

async function uploadImage(file) {
  const admin = initializeFirebase();
  if (!admin) {
    throw new Error("Firebase is not configured");
  }

  const bucket = admin.storage().bucket();
  const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
  const fileName = `spaces/${Date.now()}-${Math.round(Math.random() * 1e9)}-${safeName}`;
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

module.exports = { uploadImage };
