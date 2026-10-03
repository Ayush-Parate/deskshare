
const mongoose = require("mongoose");

async function connectDB() {
  let uri = process.env.MONGO_URI ? process.env.MONGO_URI.trim() : "";
  if (!uri) {
    throw new Error("MONGO_URI is missing in environment variables");
  }

  // Strip accidental quotes if user copied them from .env into cloud dashboard
  if ((uri.startsWith('"') && uri.endsWith('"')) || (uri.startsWith("'") && uri.endsWith("'"))) {
    uri = uri.slice(1, -1).trim();
  }

  // Strip accidental "MONGO_URI=" prefix if pasted into value field
  if (uri.startsWith("MONGO_URI=")) {
    uri = uri.replace(/^MONGO_URI=/, "").trim();
    if ((uri.startsWith('"') && uri.endsWith('"')) || (uri.startsWith("'") && uri.endsWith("'"))) {
      uri = uri.slice(1, -1).trim();
    }
  }

  await mongoose.connect(uri);
  console.log("MongoDB connected");
}

module.exports = connectDB;
