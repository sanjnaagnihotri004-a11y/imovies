
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/userModel");

// Usage: node utils/createAdmin.js <email> <username> <password>
async function run() {
  const [email, username, password] = process.argv.slice(2);

  if (!email || !username || !password) {
    console.log("Usage: node utils/createAdmin.js <email> <username> <password>");
    process.exit(1);
  }
  if (password.length < 8) {
    console.log("Password must be at least 8 characters");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    existing.role = "admin";
    await existing.save();
    console.log(`Existing user ${existing.email} is now an admin`);
  } else {
    const hashed = await bcrypt.hash(password, 10);
    await User.create({ username, email, password: hashed, role: "admin" });
    console.log(`Admin ${email} created`);
  }

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("Failed:", err.message);
  process.exit(1);
});