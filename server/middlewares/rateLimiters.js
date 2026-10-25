
const { rateLimit } = require("express-rate-limit");

// Login and register: 10 failed tries per 15 minutes per IP address
exports.authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true, // only failed attempts count
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { message: "Too many attempts. Please try again in 15 minutes." },
});

// Everything else: a generous limit that only stops abuse
exports.apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 1000,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { message: "Too many requests. Please slow down." },
});