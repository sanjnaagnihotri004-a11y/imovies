

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const connectToMongo = require("./utils/db");
const { startCleanup } = require("./utils/cleanupService");
const { apiLimiter } = require("./middlewares/rateLimiters");

// Stop early if an important setting is missing or weak
if (!process.env.MONGO_URI) {
  console.error("MONGO_URI is missing in .env");
  process.exit(1);
}
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error("JWT_SECRET is missing or shorter than 32 characters");
  process.exit(1);
}

const app = express();
app.set("trust proxy", 1);

// Middleware: runs on every request
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json({ limit: "10kb" }));
app.use("/api", apiLimiter);

// A test route so we can check the server is alive
app.get("/api/health", (req, res) => {
  res.json({ message: "iMovies API is running" });
});

// Auth routes: /api/auth/register and /api/auth/login
app.use("/api/auth", require("./routes/authRoutes"));

// Movie routes
app.use("/api/movie", require("./routes/movieRoutes"));

// Theatre routes
app.use("/api/theatre", require("./routes/theatreRoutes"));

// Show routes
app.use("/api/shows", require("./routes/showRoutes"));

// Booking routes
app.use("/api/bookings", require("./routes/bookingRoutes"));

// Favorite routes
app.use("/api/favorite", require("./routes/favoriteRoutes"));

// Review routes
app.use("/api/reviews", require("./routes/reviewRoutes"));

// Admin routes
app.use("/api/admin", require("./routes/adminRoutes"));

// Unknown address
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Any error nobody else handled (for example broken JSON in a request)
app.use((err, req, res, next) => {
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({
    message: status >= 500 ? "Server error" : "Bad request",
  });
});

// Start the server only AFTER the database connects
const PORT = process.env.PORT || 8000;

connectToMongo().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    startCleanup();
  });
});