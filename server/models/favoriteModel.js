
const mongoose = require("mongoose");

const favoriteSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    movieId: { type: mongoose.Schema.Types.ObjectId, ref: "Movie", required: true },
  },
  { timestamps: true }
);

// A user can favorite a movie only once
favoriteSchema.index({ userId: 1, movieId: 1 }, { unique: true });

module.exports = mongoose.model("Favorite", favoriteSchema);