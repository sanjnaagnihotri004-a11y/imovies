
const mongoose = require("mongoose");
const Review = require("../models/reviewModel");
const Movie = require("../models/movieModel");
const Booking = require("../models/bookingModel");
const Show = require("../models/showModel");

// Recalculate the movie's average rating from all its reviews
async function updateMovieRating(movieId) {
  const stats = await Review.aggregate([
    { $match: { movieId: new mongoose.Types.ObjectId(String(movieId)) } },
    { $group: { _id: "$movieId", avg: { $avg: "$rating" } } },
  ]);
  const avg = stats.length ? Math.round(stats[0].avg * 10) / 10 : 0;
  await Movie.findByIdAndUpdate(movieId, { rating: avg });
}

// LIST REVIEWS OF A MOVIE (public)
exports.getReviews = async (req, res) => {
  try {
    const { movieId } = req.params;
    if (!mongoose.isValidObjectId(movieId)) {
      return res.status(400).json({ message: "Invalid movie id" });
    }

    const reviews = await Review.find({ movieId })
      .sort({ createdAt: -1 })
      .populate("userId", "username");

    res.json({
      reviews: reviews.map((r) => ({
        _id: r._id,
        rating: r.rating,
        comment: r.comment,
        username: r.userId ? r.userId.username : "Deleted user",
        userId: r.userId ? r.userId._id : null,
        createdAt: r.createdAt,
      })),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// CAN I REVIEW THIS MOVIE? (logged-in users)
exports.canReview = async (req, res) => {
  try {
    const { movieId } = req.params;
    if (!mongoose.isValidObjectId(movieId)) {
      return res.status(400).json({ message: "Invalid movie id" });
    }

    const eligible = await hasConfirmedBooking(req.user.id, movieId);
    const mine = await Review.findOne({ userId: req.user.id, movieId });

    res.json({
      eligible,
      myReview: mine ? { rating: mine.rating, comment: mine.comment } : null,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Has this user got a confirmed booking for any show of this movie?
async function hasConfirmedBooking(userId, movieId) {
  const showIds = await Show.find({ movieId }).distinct("_id");
  if (showIds.length === 0) return false;
  const booking = await Booking.exists({
    userId,
    status: "confirmed",
    showId: { $in: showIds },
  });
  return Boolean(booking);
}

// ADD OR UPDATE MY REVIEW (logged-in users with a confirmed booking)
exports.saveReview = async (req, res) => {
  try {
    const { movieId } = req.params;
    const rating = Number(req.body.rating);
    const comment = req.body.comment || "";

    if (!mongoose.isValidObjectId(movieId)) {
      return res.status(400).json({ message: "Invalid movie id" });
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be a whole number from 1 to 5" });
    }

    const movie = await Movie.findById(movieId);
    if (!movie) return res.status(404).json({ message: "Movie not found" });

    if (!(await hasConfirmedBooking(req.user.id, movieId))) {
      return res
        .status(403)
        .json({ message: "You can review a movie after booking a ticket for it" });
    }

    await Review.findOneAndUpdate(
      { userId: req.user.id, movieId },
      { rating, comment },
      { upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
    await updateMovieRating(movieId);

    res.status(201).json({ message: "Review saved" });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// DELETE A REVIEW (admin only)
exports.deleteReview = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid review id" });
    }
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) return res.status(404).json({ message: "Review not found" });

    await updateMovieRating(review.movieId);
    res.json({ message: "Review deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};