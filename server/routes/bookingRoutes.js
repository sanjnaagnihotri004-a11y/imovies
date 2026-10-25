const express = require("express");
const {
  lockSeats,
  releaseBooking,
  getMyBookings,
  cancelBooking,
} = require("../controllers/bookingController");
const { createOrder, verifyPayment } = require("../controllers/paymentController");
const { fetchUser } = require("../middlewares/fetchUser");

const router = express.Router();

// Every booking route needs a logged-in user
router.post("/lock", fetchUser, lockSeats);
router.get("/my", fetchUser, getMyBookings);
router.post("/verify", fetchUser, verifyPayment);
router.post("/:id/pay", fetchUser, createOrder);
router.post("/:id/release", fetchUser, releaseBooking);
router.post("/:id/cancel", fetchUser, cancelBooking);

module.exports = router;