
const jwt = require("jsonwebtoken");

// Guard 1: is the user logged in?
exports.fetchUser = (req, res, next) => {
  const authHeader = req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Please log in first" });
  }

  const token = authHeader.replace("Bearer ", "");

  try {
    // Check the token was made with our secret and hasn't expired
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // contains { id, role }
    next(); // let the request continue
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

// Guard 2: is the user an admin? (use AFTER fetchUser)
exports.requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    return next();
  }
  return res.status(403).json({ message: "Admins only" });
};