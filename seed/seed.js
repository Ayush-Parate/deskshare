
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const connectDB = require("../config/db");
const User = require("../models/User");
const Space = require("../models/Space");

async function seed() {
  await connectDB();

  await User.deleteMany({});
  await Space.deleteMany({});

  const ownerPassword = await bcrypt.hash("Owner@123", 12);
  const userPassword = await bcrypt.hash("User@123", 12);

  const owner = await User.create({
    name: "DeskShare Owner",
    email: "owner@deskshare.com",
    passwordHash: ownerPassword,
    role: "owner"
  });

  const user = await User.create({
    name: "Demo User",
    email: "user@deskshare.com",
    passwordHash: userPassword,
    role: "user"
  });

  await Space.insertMany([
    {
      owner: owner._id,
      name: "Executive Meeting Room",
      type: "meeting-room",
      description: "8-seat meeting room with display and whiteboard.",
      location: "Andheri East, Mumbai",
      pricePerHour: 450,
      capacity: 8,
      amenities: ["WiFi", "Projector", "Whiteboard", "Air Conditioning"],
      imageUrls: [],
      available: true
    },
    {
      owner: owner._id,
      name: "Hot Desk - Window Side",
      type: "hot-desk",
      description: "Single ergonomic desk with natural light.",
      location: "Powai, Mumbai",
      pricePerHour: 150,
      capacity: 1,
      amenities: ["WiFi", "Power Socket", "Coffee"],
      imageUrls: [],
      available: true
    },
    {
      owner: owner._id,
      name: "Private Team Office",
      type: "private-office",
      description: "Private office suitable for small teams.",
      location: "Bandra Kurla Complex, Mumbai",
      pricePerHour: 900,
      capacity: 6,
      amenities: ["WiFi", "Conference Table", "AC", "Reception"],
      imageUrls: [],
      available: true
    }
  ]);

  console.log("Seed completed.");
  console.log("Owner login: owner@deskshare.com / Owner@123");
  console.log("User login: user@deskshare.com / User@123");

  await mongoose.disconnect();
}

seed().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
