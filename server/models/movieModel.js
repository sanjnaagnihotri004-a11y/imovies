
const mongoose = require("mongoose");

const movieSchema = new mongoose.Schema(
  {
    movieName: {
      type: String,
      required: [true, "Movie name is required"],
      trim: true,
      minlength: [2, "Movie name must be at least 2 characters"],
      maxlength: [200, "Movie name cannot exceed 200 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      minlength: [10, "Description must be at least 10 characters"],
    },
    genres: {
      type: [String],
      required: [true, "At least one genre is required"],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: "At least one genre is required",
      },
    },
    language: {
      type: String,
      required: [true, "Language is required"],
      trim: true,
    },
    duration: {
      type: Number, // in minutes
      required: [true, "Duration is required"],
      min: [1, "Duration must be at least 1 minute"],
    },
    cast: {
      type: [String],
      default: [],
    },
    certification: {
      type: String, // for example U, UA, A
      trim: true,
    },
    releaseDate: {
      type: Date,
      required: [true, "Release date is required"],
    },
    poster: {
      type: String, // a link to an image
      trim: true,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Movie", movieSchema);