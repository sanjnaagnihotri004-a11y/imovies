

const nodemailer = require("nodemailer");
const Booking = require("../models/bookingModel");
const User = require("../models/userModel");

let transporter;

// Created only when first needed, after the settings are loaded
function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }
  return transporter;
}

// Stops text from being treated as HTML
function esc(text) {
  return String(text).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[c]));
}

// Used for testing: checks the Gmail login works
async function verifyMailer() {
  await getTransporter().verify();
  console.log("Mailer is ready: Gmail login works");
}

// Sends the booking confirmation email
async function sendBookingConfirmation(bookingMongoId) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log("Email skipped: EMAIL_USER or EMAIL_PASS is not set");
    return;
  }

  const booking = await Booking.findById(bookingMongoId).populate({
    path: "showId",
    select: "showdate showtime movieId theatreId",
    populate: [
      { path: "movieId", select: "movieName" },
      { path: "theatreId", select: "theatreName location" },
    ],
  });
  if (!booking) return;

  const user = await User.findById(booking.userId).select("username email");
  if (!user) return;

  const show = booking.showId;
  const movie = show.movieId.movieName;
  const theatre = `${show.theatreId.theatreName}, ${show.theatreId.location}`;
  const seats = booking.seats.join(", ");

  const text =
    `Hi ${user.username},\n\nYour booking is confirmed!\n\n` +
    `Booking ID: ${booking.bookingId}\nMovie: ${movie}\nTheatre: ${theatre}\n` +
    `Date: ${show.showdate}\nTime: ${show.showtime}\nSeats: ${seats}\n` +
    `Amount paid: Rs. ${booking.amount}\n\nEnjoy the movie!\niMovies`;

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:500px">
      <h2>Booking confirmed 🎬</h2>
      <p>Hi ${esc(user.username)}, your tickets are ready.</p>
      <table cellpadding="6" style="border-collapse:collapse">
        <tr><td><b>Booking ID</b></td><td>${esc(booking.bookingId)}</td></tr>
        <tr><td><b>Movie</b></td><td>${esc(movie)}</td></tr>
        <tr><td><b>Theatre</b></td><td>${esc(theatre)}</td></tr>
        <tr><td><b>Date</b></td><td>${esc(show.showdate)}</td></tr>
        <tr><td><b>Time</b></td><td>${esc(show.showtime)}</td></tr>
        <tr><td><b>Seats</b></td><td>${esc(seats)}</td></tr>
        <tr><td><b>Amount paid</b></td><td>Rs. ${esc(booking.amount)}</td></tr>
      </table>
      <p>Enjoy the movie!<br>iMovies</p>
    </div>`;

  await getTransporter().sendMail({
    from: `"iMovies" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: `Booking confirmed: ${movie} (${booking.bookingId})`,
    text,
    html,
  });

  console.log(`Confirmation email sent to ${user.email}`);
}

module.exports = { verifyMailer, sendBookingConfirmation };