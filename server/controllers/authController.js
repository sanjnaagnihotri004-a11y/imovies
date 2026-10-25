
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

// Helper: create a login token that lasts 7 days
function createToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

// REGISTER: create a new account
exports.register = async (req, res) => {
  try {
    const { username, email, password, phone } = req.body;
        if ([username, email, password].some((v) => typeof v !== "string")) {
      return res.status(400).json({ message: "Invalid input" });
    }

    // 1. Check that required fields are present
    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ message: "Username, email and password are required" });
    }

    // 2. Check password length
    if (password.length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters" });
    }

    // 3. Check if the email or username is already taken
    const existing = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username }],
    });
    if (existing) {
      return res
        .status(409)
        .json({ message: "Email or username already in use" });
    }

    // 4. Scramble (hash) the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 5. Save the user
    const user = await User.create({
      username,
      email,
      phone,
      password: hashedPassword,
    });

    // 6. Send back a token and safe user details (never the password)
    res.status(201).json({
      message: "Registered successfully",
      token: createToken(user),
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// LOGIN: check credentials and give back a token
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
        if (typeof email !== "string" || typeof password !== "string") {
      return res.status(400).json({ message: "Invalid input" });
    }

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    // Same message for "no user" and "wrong password" so attackers learn nothing
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    res.json({
      message: "Login successful",
      token: createToken(user),
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// GET MY PROFILE: only works if logged in
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
