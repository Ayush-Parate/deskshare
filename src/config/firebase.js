const admin = require('firebase-admin');
const fs = require('fs');

let initialised = false;
function init() {
  if (initialised) return true;
  try {
    let cred;
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      cred = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH && fs.existsSync(process.env.FIREBASE_SERVICE_ACCOUNT_PATH)) {
      cred = JSON.parse(fs.readFileSync(process.env.FIREBASE_SERVICE_ACCOUNT_PATH, 'utf8'));
    } else return false;
    admin.initializeApp({
      credential: admin.credential.cert(cred),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });
    initialised = true;
    return true;
  } catch (e) {
    console.error('Firebase init failed:', e.message);
    return false;
  }
}

module.exports = { admin, isFirebaseReady: init };
