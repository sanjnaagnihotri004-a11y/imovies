
const mongoose = require("mongoose");
const crypto = require("crypto");
const Show = require("../models/showModel");
const Booking = require("../models/bookingModel");
const Payment = require("../models/paymentModel");
const LOCK_MINUTES = 5;
const MAX_SEATS = 6;

// Free seats, but only those still locked by this user
async function releaseSeats(showId, seatIds, userId) {
  for (const id of seatIds) {
    await Show.updateOne(
      {
        _id: showId,
        [`seats.${id}.status`]: "locked",
        [`seats.${id}.lockedBy`]: String(userId),
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

// LOCK SEATS and create a pending booking (logged-in users)
exports.lockSeats = async (req, res) => {
  try {
    const { showId } = req.body;
    let { seats } = req.body;

    if (!mongoose.isValidObjectId(showId)) {
      return res.status(400).json({ message: "Invalid show id" });
    }
    if (!Array.isArray(seats) || seats.length === 0) {
      return res.status(400).json({ message: "Select at least one seat" });
    }

    // Tidy the list: capital letters, no duplicates
    seats = [...new Set(seats.map((s) => String(s).trim().toUpperCase()))];

    if (seats.length > MAX_SEATS) {
      return res
        .status(400)
        .json({ message: `You can book at most ${MAX_SEATS} seats at once` });
    }
    if (!seats.every((s) => /^[A-Z][0-9]{1,2}$/.test(s))) {
      return res.status(400).json({ message: "Invalid seat name" });
    }

    const show = await Show.findById(showId);
    if (!show) return res.status(404).json({ message: "Show not found" });

    // Work out the price on the SERVER (never trust the browser)
    let amount = 0;
    for (const id of seats) {
      const seat = show.seats.get(id);
      if (!seat) {
        return res.status(400).json({ message: `Seat ${id} does not exist` });
      }
      amount += seat.price;
    }

    const now = new Date();
    const lockedUntil = new Date(now.getTime() + LOCK_MINUTES * 60 * 1000);

    // Each seat must be available, or have a lock that has already run out
    const conditions = seats.map((id) => ({
      $or: [
        { [`seats.${id}.status`]: "available" },
        {
          [`seats.${id}.status`]: "locked",
          [`seats.${id}.lockedUntil`]: { $lt: now },
        },
      ],
    }));

    const changes = {};
    seats.forEach((id) => {
      changes[`seats.${id}.status`] = "locked";
      changes[`seats.${id}.lockedBy`] = String(req.user.id);
      changes[`seats.${id}.lockedUntil`] = lockedUntil;
    });

    // ONE atomic command: it either locks ALL the seats or NONE of them
    const result = await Show.updateOne(
      { _id: showId, $and: conditions },
      { $set: changes }
    );

    if (result.matchedCount === 0) {
      return res
        .status(409)
        .json({ message: "Some of those seats are no longer available" });
    }

    // Create the pending booking. If that fails, free the seats again.
    try {
      const booking = await Booking.create({
        bookingId: "BK" + crypto.randomBytes(4).toString("hex").toUpperCase(),
        userId: req.user.id,
        showId,
        seats,
        amount,
        status: "pending",
        expiresAt: lockedUntil,
      });

      return res.status(201).json({
        message: `Seats locked for ${LOCK_MINUTES} minutes`,
        booking: {
          _id: booking._id,
          bookingId: booking.bookingId,
          seats: booking.seats,
          amount: booking.amount,
          status: booking.status,
          expiresAt: booking.expiresAt,
        },
      });
    } catch (err) {
      await releaseSeats(showId, seats, req.user.id);
      throw err;
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// RELEASE a pending booking (the user changed their mind)
exports.releaseBooking = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid booking id" });
    }

    const booking = await Booking.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (booking.status !== "pending") {
      return res
        .status(400)
        .json({ message: "Only pending bookings can be released" });
    }

    await releaseSeats(booking.showId, booking.seats, req.user.id);
    booking.status = "cancelled";
    await booking.save();

    res.json({ message: "Seats released" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// MY BOOKINGS (logged-in users)
exports.getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .populate({
        path: "showId",
        select: "showdate showtime movieId theatreId",
        populate: [
          { path: "movieId", select: "movieName poster" },
          { path: "theatreId", select: "theatreName location" },
        ],
      });

    res.json({ bookings });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const CANCEL_HOURS = 2;

// CANCEL A CONFIRMED BOOKING (only the owner, and only well before the show)
exports.cancelBooking = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid booking id" });
    }

    const booking = await Booking.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (booking.status !== "confirmed") {
      return res
        .status(400)
        .json({ message: "Only confirmed bookings can be cancelled" });
    }

    const show = await Show.findById(booking.showId);
    if (!show) {
      return res
        .status(400)
        .json({ message: "This show no longer exists. Please contact support." });
    }

    // Show times are in Indian time (+05:30), whatever time zone the server is in
    const showStart = new Date(`${show.showdate}T${show.showtime}:00+05:30`);
    const cutoff = new Date(showStart.getTime() - CANCEL_HOURS * 60 * 60 * 1000);
    if (new Date() > cutoff) {
      return res.status(400).json({
        message: `Bookings can only be cancelled more than ${CANCEL_HOURS} hours before the show`,
      });
    }

    // Claim the booking first, so two clicks can't cancel it twice
    const claimed = await Booking.findOneAndUpdate(
      { _id: booking._id, status: "confirmed" },
      { status: "cancelled" }
    );
    if (!claimed) {
      return res.status(400).json({ message: "This booking was already cancelled" });
    }

    // Free all the seats in one command (only seats that are really booked)
    const conditions = booking.seats.map((id) => ({
      [`seats.${id}.status`]: "booked",
    }));
    const changes = {};
    booking.seats.forEach((id) => {
      changes[`seats.${id}.status`] = "available";
      changes[`seats.${id}.lockedBy`] = null;
      changes[`seats.${id}.lockedUntil`] = null;
    });
    const freed = await Show.updateOne(
      { _id: booking.showId, $and: conditions },
      { $set: changes }
    );
    if (freed.matchedCount === 0) {
      console.error(`Cancel: seats of ${booking.bookingId} were not in the booked state`);
    }

    // Mark the payment so a refund can be made
    await Payment.updateOne(
      { bookingId: booking._id, status: "paid" },
      { status: "refund_needed" }
    );

    res.json({
      message: "Booking cancelled. Your refund will be processed.",
      bookingId: booking.bookingId,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};