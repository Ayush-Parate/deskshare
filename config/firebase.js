
const admin = require("firebase-admin");

let firebaseReady = false;

// Returns a usable storage bucket name, deriving it from the project id when the
// env var is missing or left as a placeholder (e.g. "your-firebase-project-id.appspot.com").
function resolveStorageBucket(projectId) {
  const configured = (process.env.FIREBASE_STORAGE_BUCKET || "").trim();

  const isPlaceholder =
    !configured ||
    configured.includes("your-firebase-project-id") ||
    configured.includes("your-project-id");

  if (!isPlaceholder) return configured;

  return projectId ? `${projectId}.firebasestorage.app` : undefined;
}

function initializeFirebase() {
  if (firebaseReady) return admin;

  const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } = process.env;

  if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
    console.warn("Firebase Admin credentials are not configured. Firebase features will be unavailable.");
    return null;
  }

  try {
    const privateKey = FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n");
    const storageBucket = resolveStorageBucket(FIREBASE_PROJECT_ID);

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: FIREBASE_PROJECT_ID,
        clientEmail: FIREBASE_CLIENT_EMAIL,
        privateKey
      }),
      storageBucket
    });

    firebaseReady = true;
    return admin;
  } catch (error) {
    console.warn("Failed to initialize Firebase Admin SDK:", error.message);
    return null;
  }
}

module.exports = { initializeFirebase };
