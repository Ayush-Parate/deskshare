
const Space = require("../models/Space");
const { uploadImage } = require("../utils/firebaseStorage");

exports.getSpaces = async (req, res, next) => {
  try {
    const spaces = await Space.find({ available: true }).populate("owner", "name email role");
    res.json({ success: true, count: spaces.length, data: spaces });
  } catch (error) {
    next(error);
  }
};

exports.getSpace = async (req, res, next) => {
  try {
    const space = await Space.findById(req.params.id).populate("owner", "name email role");
    if (!space) return res.status(404).json({ success: false, message: "Space not found" });
    res.json({ success: true, data: space });
  } catch (error) {
    next(error);
  }
};

exports.createSpace = async (req, res, next) => {
  try {
    const { name, type, description, location, pricePerHour, capacity, amenities } = req.body;

    const imageUrls = [];
    if (req.files?.length) {
      for (const file of req.files) {
        imageUrls.push(await uploadImage(file));
      }
    }

    const space = await Space.create({
      owner: req.user._id,
      name,
      type,
      description,
      location,
      pricePerHour,
      capacity,
      amenities: Array.isArray(amenities) ? amenities : (amenities ? [amenities] : []),
      imageUrls
    });

    res.status(201).json({ success: true, message: "Space created", data: space });
  } catch (error) {
    next(error);
  }
};

exports.updateSpace = async (req, res, next) => {
  try {
    const space = await Space.findById(req.params.id);
    if (!space) return res.status(404).json({ success: false, message: "Space not found" });

    if (space.owner.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "You cannot modify this space" });
    }

    const allowed = ["name", "type", "description", "location", "pricePerHour", "capacity", "amenities", "available"];
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) {
        space[field] = req.body[field];
      }
    });

    if (req.files?.length) {
      for (const file of req.files) {
        space.imageUrls.push(await uploadImage(file));
      }
    }

    await space.save();
    res.json({ success: true, message: "Space updated", data: space });
  } catch (error) {
    next(error);
  }
};

exports.deleteSpace = async (req, res, next) => {
  try {
    const space = await Space.findById(req.params.id);
    if (!space) return res.status(404).json({ success: false, message: "Space not found" });

    if (space.owner.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "You cannot delete this space" });
    }

    await space.deleteOne();
    res.json({ success: true, message: "Space deleted" });
  } catch (error) {
    next(error);
  }
};

exports.searchSpaces = async (req, res, next) => {
  try {
    const keyword = (req.query.keyword || "").trim();

    if (!keyword) {
      return res.status(400).json({ success: false, message: "keyword query parameter is required" });
    }

    const spaces = await Space.find({
      available: true,
      $text: { $search: keyword }
    }).populate("owner", "name");

    res.json({ success: true, count: spaces.length, keyword, data: spaces });
  } catch (error) {
    next(error);
  }
};
