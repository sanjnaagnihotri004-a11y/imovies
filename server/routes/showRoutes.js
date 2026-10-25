
const express = require("express");
const {
  createShow,
  getShows,
  getShowById,
  getShowSeats,
  deleteShow,
} = require("../controllers/showController");
const { fetchUser, requireAdmin } = require("../middlewares/fetchUser");

const router = express.Router();

router.get("/", getShows);
router.get("/:id/seats", getShowSeats);
router.get("/:id", getShowById);

router.post("/", fetchUser, requireAdmin, createShow);
router.delete("/:id", fetchUser, requireAdmin, deleteShow);

module.exports = router;