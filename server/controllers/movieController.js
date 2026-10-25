
const mongoose = require("mongoose");
const Movie = require("../models/movieModel");
const Show = require("../models/showModel");

// GET ALL MOVIES (public) with search, filters and pages
// Example: /api/movie?search=avengers&genre=Action&language=English&page=1&limit=10
exports.getMovies = async (req, res) => {
  try {
    const { search, genre, language } = req.query;
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);

    const filter = {};
    if (search) {
      // escape special characters so the search can't break the pattern
      const safe = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.movieName = { $regex: safe, $options: "i" };
    }
    if (genre) filter.genres = genre;
    if (language) filter.language = language;

    const total = await Movie.countDocuments(filter);
    const movies = await Movie.find(filter)
      .sort({ releaseDate: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      movies,
      page,
      totalPages: Math.ceil(total / limit),
      total,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// GET ONE MOVIE (public)
exports.getMovieById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid movie id" });
    }
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      return res.status(404).json({ message: "Movie not found" });
    }
    res.json({ movie });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// CREATE MOVIE (admin only)
exports.createMovie = async (req, res) => {
  try {
    const movie = await Movie.create(req.body);
    res.status(201).json({ message: "Movie created", movie });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// UPDATE MOVIE (admin only)
exports.updateMovie = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid movie id" });
    }
    const movie = await Movie.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!movie) {
      return res.status(404).json({ message: "Movie not found" });
    }
    res.json({ message: "Movie updated", movie });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// DELETE MOVIE (admin only)
exports.deleteMovie = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid movie id" });
    }
    if (await Show.exists({ movieId: req.params.id })) {
      return res.status(409).json({
        message: "This movie still has shows. Delete those shows first.",
      });
    }

    const movie = await Movie.findByIdAndDelete(req.params.id);
    if (!movie) {
      return res.status(404).json({ message: "Movie not found" });
    }
    res.json({ message: "Movie deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};