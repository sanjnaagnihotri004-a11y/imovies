const mongoose = require("mongoose");
const User = require("../models/userModel");
const Movie = require("../models/movieModel");
const Theatre = require("../models/theatreModel");
const Show = require("../models/showModel");
const Booking = require("../models/bookingModel");
const Payment = require("../models/paymentModel");
const Review = require("../models/reviewModel");

// DASHBOARD NUMBERS (admin only)
exports.getStats = async (req, res) => {
  try {
    const [users, movies, theatres, shows, confirmedBookings, cancelledBookings] =
      await Promise.all([
        User.countDocuments({ role: "user" }),
        Movie.countDocuments(),
        Theatre.countDocuments(),
        Show.countDocuments(),
        Booking.countDocuments({ status: "confirmed" }),
        Booking.countDocuments({ status: "cancelled" }),
      ]);

    // Total money and tickets from confirmed bookings
    const totals = await Booking.aggregate([
      { $match: { status: "confirmed" } },
      {
        $group: {
          _id: null,
          revenue: { $sum: "$amount" },
          tickets: { $sum: { $size: "$seats" } },
        },
      },
    ]);

    // Revenue per movie, best first
    const byMovie = await Booking.aggregate([
      { $match: { status: "confirmed" } },
      {
        $lookup: {
          from: "shows",
          localField: "showId",
          foreignField: "_id",
          as: "show",
        },
      },
      { $unwind: "$show" },
      {
        $group: {
          _id: "$show.movieId",
          revenue: { $sum: "$amount" },
          tickets: { $sum: { $size: "$seats" } },
          bookings: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "movies",
          localField: "_id",
          foreignField: "_id",
          as: "movie",
        },
      },
      { $unwind: "$movie" },
      {
        $project: {
          _id: 0,
          movieName: "$movie.movieName",
          revenue: 1,
          tickets: 1,
          bookings: 1,
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 10 },
    ]);

    res.json({
      users,
      movies,
      theatres,
      shows,
      confirmedBookings,
      cancelledBookings,
      revenue: totals[0]?.revenue || 0,
      tickets: totals[0]?.tickets || 0,
      byMovie,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
// Makes user-typed text safe to use inside a search pattern
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const PAGE_SIZE = 15;
const getPage = (req) => Math.max(parseInt(req.query.page) || 1, 1);

// ALL BOOKINGS (admin only). Optional: ?status=confirmed&page=1
exports.getBookings = async (req, res) => {
  try {
    const page = getPage(req);
    const filter = {};
    const allowed = ["pending", "confirmed", "cancelled", "failed"];
    if (allowed.includes(req.query.status)) filter.status = req.query.status;

    const total = await Booking.countDocuments(filter);
    const bookings = await Booking.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .populate("userId", "username email")
      .populate({
        path: "showId",
        select: "showdate showtime movieId theatreId",
        populate: [
          { path: "movieId", select: "movieName" },
          { path: "theatreId", select: "theatreName" },
        ],
      })
      .lean();

    // A booking can have several payment attempts. Show the most important one.
    const rank = { created: 1, failed: 2, paid: 3, refund_needed: 4, refunded: 5 };
    const payments = await Payment.find({
      bookingId: { $in: bookings.map((b) => b._id) },
    })
      .select("bookingId status")
      .lean();
    const paymentStatus = {};
    payments.forEach((p) => {
      const key = String(p.bookingId);
      if (!paymentStatus[key] || rank[p.status] > rank[paymentStatus[key]]) {
        paymentStatus[key] = p.status;
      }
    });

    res.json({
      bookings: bookings.map((b) => ({
        ...b,
        paymentStatus: paymentStatus[String(b._id)] || "none",
      })),
      page,
      totalPages: Math.max(Math.ceil(total / PAGE_SIZE), 1),
      total,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// PAYMENTS THAT NEED A REFUND (admin only)
exports.getRefunds = async (req, res) => {
  try {
    const refunds = await Payment.find({ status: "refund_needed" })
      .sort({ updatedAt: -1 })
      .populate("userId", "username email")
      .populate("bookingId", "bookingId seats status")
      .lean();
    res.json({ refunds });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// MARK A REFUND AS DONE (admin only)
exports.markRefunded = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid payment id" });
    }
    const payment = await Payment.findOneAndUpdate(
      { _id: req.params.id, status: "refund_needed" },
      { status: "refunded" }
    );
    if (!payment) {
      return res
        .status(404)
        .json({ message: "No refund is waiting for this payment" });
    }
    res.json({ message: "Marked as refunded" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// ALL USERS (admin only). Optional: ?search=text&page=1
exports.getUsers = async (req, res) => {
  try {
    const page = getPage(req);
    const filter = {};
    if (req.query.search) {
      const safe = escapeRegex(String(req.query.search));
      filter.$or = [
        { username: { $regex: safe, $options: "i" } },
        { email: { $regex: safe, $options: "i" } },
      ];
    }

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .select("-password") // never send password hashes
      .sort({ createdAt: -1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE);

    res.json({
      users,
      page,
      totalPages: Math.max(Math.ceil(total / PAGE_SIZE), 1),
      total,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// ALL REVIEWS (admin only). Optional: ?page=1
exports.getAllReviews = async (req, res) => {
  try {
    const page = getPage(req);
    const total = await Review.countDocuments();
    const reviews = await Review.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .populate("userId", "username")
      .populate("movieId", "movieName");

    res.json({
      reviews,
      page,
      totalPages: Math.max(Math.ceil(total / PAGE_SIZE), 1),
      total,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};