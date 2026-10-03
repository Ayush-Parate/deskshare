const mongoose = require('mongoose');
module.exports = async () => {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('MongoDB connection failed: MONGO_URI is not set. Copy .env.example to .env and configure a MongoDB connection string.');
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  }
};
