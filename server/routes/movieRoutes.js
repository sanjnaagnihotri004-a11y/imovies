
const express = require("express");
const {
  getMovies,
  getMovieById,
  createMovie,
  updateMovie,
  deleteMovie,
} = require("../controllers/movieController");
const { fetchUser, requireAdmin } = require("../middlewares/fetchUser");

const router = express.Router();

// Anyone can view movies
router.get("/", getMovies);
router.get("/:id", getMovieById);

// Only logged-in admins can change movies (two guards in a row)
router.post("/", fetchUser, requireAdmin, createMovie);
router.put("/:id", fetchUser, requireAdmin, updateMovie);
router.delete("/:id", fetchUser, requireAdmin, deleteMovie);

module.exports = router;