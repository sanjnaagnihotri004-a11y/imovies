
const mongoose = require("mongoose");
const Show = require("../models/showModel");
const Movie = require("../models/movieModel");
const Theatre = require("../models/theatreModel");
const Booking = require("../models/bookingModel");

// Turn a theatre's layout into a seat map like { A1: {...}, A2: {...} }
function buildSeats(theatre) {
  const seats = {};
  let rowIndex = 0;

  for (const area of ["lower", "middle", "balcony"]) {
    const { rows, seatsPerRow, price } = theatre[area];
    for (let r = 0; r < rows; r++) {
      const letter = String.fromCharCode(65 + rowIndex); // 65 = "A"
      rowIndex++;
      for (let n = 1; n <= seatsPerRow; n++) {
        seats[`${letter}${n}`] = { category: area, price, status: "available" };
      }
    }
  }
  return seats;
}

// CREATE SHOW (admin only)
exports.createShow = async (req, res) => {
  try {
    const { movieId, theatreId, showdate, showtime } = req.body;

    if (!movieId || !theatreId || !showdate || !showtime) {
      return res
        .status(400)
        .json({ message: "movieId, theatreId, showdate and showtime are required" });
    }
    if (!mongoose.isValidObjectId(movieId) || !mongoose.isValidObjectId(theatreId)) {
      return res.status(400).json({ message: "Invalid movie or theatre id" });
    }

    const movie = await Movie.findById(movieId);
    if (!movie) return res.status(404).json({ message: "Movie not found" });

    const theatre = await Theatre.findById(theatreId);
    if (!theatre) return res.status(404).json({ message: "Theatre not found" });

    const totalRows = theatre.lower.rows + theatre.middle.rows + theatre.balcony.rows;
    if (totalRows > 26) {
      return res
        .status(400)
        .json({ message: "A theatre can have at most 26 rows in total (A to Z)" });
    }

    const show = await Show.create({
      movieId,
      theatreId,
      showdate,
      showtime,
      seats: buildSeats(theatre),
      createdBy: req.user.id,
    });

    res.status(201).json({
      message: "Show created",
      show: {
        _id: show._id,
        movieId: show.movieId,
        theatreId: show.theatreId,
        showdate: show.showdate,
        showtime: show.showtime,
        totalSeats: show.seats.size,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(409)
        .json({ message: "This theatre already has a show at that date and time" });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// GET SHOWS (public). Filters: ?movieId=&theatreId=&date=2026-11-05
exports.getShows = async (req, res) => {
  try {
    const { movieId, theatreId, date } = req.query;
    const filter = {};

    if (movieId) {
      if (!mongoose.isValidObjectId(movieId)) {
        return res.status(400).json({ message: "Invalid movie id" });
      }
      filter.movieId = movieId;
    }
    if (theatreId) {
      if (!mongoose.isValidObjectId(theatreId)) {
        return res.status(400).json({ message: "Invalid theatre id" });
      }
      filter.theatreId = theatreId;
    }
    if (date) filter.showdate = date;

    const shows = await Show.find(filter)
      .select("-seats") // seats are big, so the list leaves them out
      .populate("movieId", "movieName poster language duration")
      .populate("theatreId", "theatreName location")
      .sort({ showdate: 1, showtime: 1 });

    res.json({ shows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// GET ONE SHOW (public), without the seats
exports.getShowById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid show id" });
    }
    const show = await Show.findById(req.params.id)
      .select("-seats")
      .populate("movieId", "movieName poster language duration")
      .populate("theatreId", "theatreName location");

    if (!show) return res.status(404).json({ message: "Show not found" });
    res.json({ show });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// GET SEAT LAYOUT for a show (public)
exports.getShowSeats = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid show id" });
    }
    const show = await Show.findById(req.params.id);
    if (!show) return res.status(404).json({ message: "Show not found" });

    const raw = show.toObject({ flattenMaps: true }).seats;
    const now = new Date();
    const seats = {};

    for (const [seatId, seat] of Object.entries(raw)) {
      // A lock that has run out counts as available again
      const lockExpired =
        seat.status === "locked" && seat.lockedUntil && seat.lockedUntil < now;

      seats[seatId] = {
        category: seat.category,
        price: seat.price,
        status: lockExpired ? "available" : seat.status,
      };
    }

    res.json({ showId: show._id, seats });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// DELETE SHOW (admin only)
exports.deleteShow = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid show id" });
    }
    const hasBookings = await Booking.exists({
      showId: req.params.id,
      status: { $in: ["pending", "confirmed"] },
    });
    if (hasBookings) {
      return res.status(409).json({
        message: "This show has active bookings, so it cannot be deleted",
      });
    }

    const show = await Show.findByIdAndDelete(req.params.id);
    if (!show) return res.status(404).json({ message: "Show not found" });
    res.json({ message: "Show deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};