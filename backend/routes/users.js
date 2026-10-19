const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/user");
const { authenticateToken, requireAdmin } = require("../middleware/auth");

const router = express.Router();

router.use(authenticateToken, requireAdmin);

function sanitize(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
  };
}

// List all staff (and admins)
router.get("/", async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users.map(sanitize));
  } catch {
    res.status(500).json({ message: "Could not fetch staff" });
  }
});

// Create a staff member
router.post("/", async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;

    if (!name?.trim() || !email?.trim() || !password || password.length < 8) {
      return res.status(400).json({
        message: "Provide name, email and a password of at least 8 characters",
      });
    }

    const existing = await User.findOne({
      email: email.toLowerCase().trim(),
    });
    if (existing) {
      return res.status(409).json({ message: "Email already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      phone: phone || "",
      role: role === "admin" ? "admin" : "staff",
    });

    res.status(201).json(sanitize(user));
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Email already in use" });
    }
    res.status(500).json({ message: "Could not create staff member" });
  }
});

// Update a staff member
router.put("/:id", async (req, res) => {
  try {
    const { name, email, phone, role, isActive, password } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "Staff member not found" });
    }

    if (name !== undefined && name.trim()) user.name = name.trim();
    if (email !== undefined && email.trim()) {
      user.email = email.toLowerCase().trim();
    }
    if (phone !== undefined) user.phone = phone;
    if (role !== undefined) user.role = role === "admin" ? "admin" : "staff";
    if (isActive !== undefined) user.isActive = Boolean(isActive);

    // An admin cannot lock themselves out.
    if (user._id.toString() === req.user.id && user.isActive === false) {
      return res
        .status(400)
        .json({ message: "You cannot deactivate your own account" });
    }
    if (user._id.toString() === req.user.id && user.role !== "admin") {
      return res
        .status(400)
        .json({ message: "You cannot remove your own admin access" });
    }

    if (password) {
      if (password.length < 8) {
        return res
          .status(400)
          .json({ message: "Password must be at least 8 characters" });
      }
      user.password = await bcrypt.hash(password, 12);
    }

    await user.save();
    res.json(sanitize(user));
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Email already in use" });
    }
    res.status(500).json({ message: "Could not update staff member" });
  }
});

// Delete a staff member
router.delete("/:id", async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res
        .status(400)
        .json({ message: "You cannot delete your own account" });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "Staff member not found" });
    }

    res.json({ message: "Staff member deleted" });
  } catch {
    res.status(400).json({ message: "Invalid staff ID" });
  }
});

module.exports = router;
