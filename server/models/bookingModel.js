
const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    bookingId: { type: String, required: true, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    showId: { type: mongoose.Schema.Types.ObjectId, ref: "Show", required: true },
    seats: { type: [String], required: true },
    amount: { type: Number, required: true }, // calculated by the server
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "failed"],
      default: "pending",
    },
    expiresAt: { type: Date }, // when the seat lock runs out
  },
  { timestamps: true }
);

bookingSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("Booking", bookingSchema);