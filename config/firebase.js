
const admin = require("firebase-admin");

let firebaseReady = false;

function initializeFirebase() {
  if (firebaseReady) return admin;

  const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } = process.env;

  if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
    console.warn("Firebase Admin credentials are not configured. Firebase features will be unavailable.");
    return null;
  }

  const privateKey = FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n");

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: FIREBASE_PROJECT_ID,
      clientEmail: FIREBASE_CLIENT_EMAIL,
      privateKey
    }),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET
  });

  firebaseReady = true;
  return admin;
}

module.exports = { initializeFirebase };
