const express = require("express");
const { register, login, getMe } = require("../controllers/authController");
const { fetchUser } = require("../middlewares/fetchUser");
const { authLimiter } = require("../middlewares/rateLimiters");

const router = express.Router();

router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.get("/me", fetchUser, getMe);

module.exports = router;