
const mongoose = require("mongoose");

// One seat inside a show
const seatSchema = new mongoose.Schema(
  {
    category: { type: String, enum: ["lower", "middle", "balcony"], required: true },
    price: { type: Number, required: true },
    status: {
      type: String,
      enum: ["available", "locked", "booked"],
      default: "available",
    },
    lockedBy: { type: String, default: null }, // user id who holds the lock
    lockedUntil: { type: Date, default: null }, // when the lock expires
  },
  { _id: false }
);

const showSchema = new mongoose.Schema(
  {
    movieId: { type: mongoose.Schema.Types.ObjectId, ref: "Movie", required: true },
    theatreId: { type: mongoose.Schema.Types.ObjectId, ref: "Theatre", required: true },
    showdate: {
      type: String, // "YYYY-MM-DD"
      required: [true, "Show date is required"],
      match: [/^\d{4}-\d{2}-\d{2}$/, "Date must look like 2026-11-05"],
    },
    showtime: {
      type: String, // "HH:mm" in 24-hour time
      required: [true, "Show time is required"],
      match: [/^([01]\d|2[0-3]):[0-5]\d$/, "Time must look like 18:30"],
    },
    seats: { type: Map, of: seatSchema, required: true },
    createdBy: { type: String }, // admin user id
  },
  { timestamps: true }
);

// One theatre can't have two shows at the same date and time
showSchema.index({ theatreId: 1, showdate: 1, showtime: 1 }, { unique: true });
// Fast lookup of shows for a movie on a date
showSchema.index({ movieId: 1, showdate: 1 });

module.exports = mongoose.model("Show", showSchema);