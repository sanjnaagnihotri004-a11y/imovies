
const express = require("express");
const {
  getReviews,
  canReview,
  saveReview,
  deleteReview,
} = require("../controllers/reviewController");
const { fetchUser, requireAdmin } = require("../middlewares/fetchUser");

const router = express.Router();

router.get("/:movieId", getReviews);
router.get("/:movieId/can-review", fetchUser, canReview);
router.post("/:movieId", fetchUser, saveReview);
router.delete("/:id", fetchUser, requireAdmin, deleteReview);

module.exports = router;