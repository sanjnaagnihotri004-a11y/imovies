
const mongoose = require("mongoose");
const Favorite = require("../models/favoriteModel");
const Movie = require("../models/movieModel");

// LIST MY FAVORITE MOVIES
exports.getFavorites = async (req, res) => {
  try {
    const favorites = await Favorite.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .populate("movieId");

    // Skip favorites whose movie was deleted
    const movies = favorites.map((f) => f.movieId).filter(Boolean);
    res.json({ movies });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// ADD A FAVORITE
exports.addFavorite = async (req, res) => {
  try {
    const { movieId } = req.params;
    if (!mongoose.isValidObjectId(movieId)) {
      return res.status(400).json({ message: "Invalid movie id" });
    }

    const movie = await Movie.findById(movieId);
    if (!movie) return res.status(404).json({ message: "Movie not found" });

    try {
      await Favorite.create({ userId: req.user.id, movieId });
    } catch (err) {
      // Already a favorite. That's fine, so we treat it as success.
      if (err.code !== 11000) throw err;
    }

    res.status(201).json({ message: "Added to favorites" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// REMOVE A FAVORITE
exports.removeFavorite = async (req, res) => {
  try {
    const { movieId } = req.params;
    if (!mongoose.isValidObjectId(movieId)) {
      return res.status(400).json({ message: "Invalid movie id" });
    }

    await Favorite.deleteOne({ userId: req.user.id, movieId });
    res.json({ message: "Removed from favorites" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};