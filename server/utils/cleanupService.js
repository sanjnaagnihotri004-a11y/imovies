
const cron = require("node-cron");
const Show = require("../models/showModel");
const Booking = require("../models/bookingModel");

async function cleanupExpiredLocks() {
  try {
    const now = new Date();

    // Pending bookings whose timer has run out
    const expired = await Booking.find({
      status: "pending",
      expiresAt: { $lt: now },
    });

    for (const booking of expired) {
      // Claim it first, so two runs can't handle the same booking
      const claimed = await Booking.findOneAndUpdate(
        { _id: booking._id, status: "pending" },
        { status: "failed" }
      );
      if (!claimed) continue;

      // Free each seat, only if it is still locked by this user and expired
      for (const id of booking.seats) {
        await Show.updateOne(
          {
            _id: booking.showId,
            [`seats.${id}.status`]: "locked",
            [`seats.${id}.lockedBy`]: String(booking.userId),
            [`seats.${id}.lockedUntil`]: { $lt: now },
          },
          {
            $set: {
              [`seats.${id}.status`]: "available",
              [`seats.${id}.lockedBy`]: null,
              [`seats.${id}.lockedUntil`]: null,
            },
          }
        );
      }
    }

    if (expired.length > 0) {
      console.log(`Cleanup: released ${expired.length} expired booking(s)`);
    }
  } catch (error) {
    console.error("Cleanup error:", error.message);
  }
}

// Runs once every minute
function startCleanup() {
  cron.schedule("* * * * *", cleanupExpiredLocks);
  console.log("Cleanup job started (every minute)");
}

module.exports = { startCleanup, cleanupExpiredLocks };