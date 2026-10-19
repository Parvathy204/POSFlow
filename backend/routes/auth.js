const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// Initial admin setup.
// Allow only when no users exist yet.
router.post("/setup-admin", async (req, res) => {
  try {
    const count = await User.countDocuments();

    if (count > 0) {
      return res.status(403).json({
        message: "Setup is closed. Users already exist.",
      });
    }

    const { name, email, password } = req.body;

    if (!name || !email || !password || password.length < 8) {
      return res.status(400).json({
        message: "Provide name, email and a password of at least 8 characters.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const admin = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "admin",
    });

    res.status(201).json({
      message: "Admin created successfully",
      user: sanitize(admin),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Email already in use" });
    }
    res.status(500).json({ message: "Could not create admin" });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        message: "Account is deactivated. Contact the admin.",
      });
    }

    const token = jwt.sign(
      { id: user._id.toString(), role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({
      message: "Login successful",
      token,
      user: sanitize(user),
    });
  } catch (error) {
    res.status(500).json({ message: "Login failed" });
  }
});

// Current user profile
router.get("/me", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(sanitize(user));
  } catch {
    res.status(500).json({ message: "Could not load profile" });
  }
});

function sanitize(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    isActive: user.isActive,
  };
}

module.exports = router;
