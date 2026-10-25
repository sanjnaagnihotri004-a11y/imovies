

const express = require("express");
const {
  getStats,
  getBookings,
  getRefunds,
  markRefunded,
  getUsers,
  getAllReviews,
} = require("../controllers/adminController");
const { fetchUser, requireAdmin } = require("../middlewares/fetchUser");

const router = express.Router();

// Everything in this file is admin only
router.use(fetchUser, requireAdmin);

router.get("/stats", getStats);
router.get("/bookings", getBookings);
router.get("/refunds", getRefunds);
router.post("/payments/:id/refunded", markRefunded);
router.get("/users", getUsers);
router.get("/reviews", getAllReviews);

module.exports = router;