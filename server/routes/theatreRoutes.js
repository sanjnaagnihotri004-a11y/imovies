
const express = require("express");
const {
  getTheatres,
  getTheatreById,
  createTheatre,
  updateTheatre,
  deleteTheatre,
} = require("../controllers/theatreController");
const { fetchUser, requireAdmin } = require("../middlewares/fetchUser");

const router = express.Router();

// Anyone can view theatres
router.get("/", getTheatres);
router.get("/:id", getTheatreById);

// Only admins can change them
router.post("/", fetchUser, requireAdmin, createTheatre);
router.put("/:id", fetchUser, requireAdmin, updateTheatre);
router.delete("/:id", fetchUser, requireAdmin, deleteTheatre);

module.exports = router;