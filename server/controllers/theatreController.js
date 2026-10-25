
const mongoose = require("mongoose");
const Theatre = require("../models/theatreModel");
const Show = require("../models/showModel");

// GET ALL THEATRES (public). Optional filter: /api/theatre?location=Jabalpur
exports.getTheatres = async (req, res) => {
  try {
    const filter = {};
    if (req.query.location) {
      const safe = req.query.location.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.location = { $regex: safe, $options: "i" };
    }
    const theatres = await Theatre.find(filter).sort({ theatreName: 1 });
    res.json({ theatres });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// GET ONE THEATRE (public)
exports.getTheatreById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid theatre id" });
    }
    const theatre = await Theatre.findById(req.params.id);
    if (!theatre) {
      return res.status(404).json({ message: "Theatre not found" });
    }
    res.json({ theatre });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// CREATE THEATRE (admin only)
exports.createTheatre = async (req, res) => {
  try {
    const theatre = await Theatre.create(req.body);
    res.status(201).json({ message: "Theatre created", theatre });
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(409)
        .json({ message: "This theatre already exists in that location" });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// UPDATE THEATRE (admin only)
exports.updateTheatre = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid theatre id" });
    }
    const theatre = await Theatre.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!theatre) {
      return res.status(404).json({ message: "Theatre not found" });
    }
    res.json({ message: "Theatre updated", theatre });
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(409)
        .json({ message: "This theatre already exists in that location" });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// DELETE THEATRE (admin only)
exports.deleteTheatre = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid theatre id" });
    }
        if (await Show.exists({ theatreId: req.params.id })) {
      return res.status(409).json({
        message: "This theatre still has shows. Delete those shows first.",
      });
    }
    const theatre = await Theatre.findByIdAndDelete(req.params.id);
    if (!theatre) {
      return res.status(404).json({ message: "Theatre not found" });
    }
    res.json({ message: "Theatre deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};