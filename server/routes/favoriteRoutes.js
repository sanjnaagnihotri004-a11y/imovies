
const express = require("express");
const {
  getFavorites,
  addFavorite,
  removeFavorite,
} = require("../controllers/favoriteController");
const { fetchUser } = require("../middlewares/fetchUser");

const router = express.Router();

// All favorite routes need a logged-in user
router.get("/", fetchUser, getFavorites);
router.post("/:movieId", fetchUser, addFavorite);
router.delete("/:movieId", fetchUser, removeFavorite);

module.exports = router;