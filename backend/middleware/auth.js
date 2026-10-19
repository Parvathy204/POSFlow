const jwt = require("jsonwebtoken");
const User = require("../models/user");

async function authenticateToken(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authentication required" });
  }

  let payload;
  try {
    payload = jwt.verify(header.slice(7), process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }

  // Re-check the account in the DB so deactivation takes effect immediately.
  try {
    const user = await User.findById(payload.id).select("isActive role");
    if (!user || !user.isActive) {
      return res
        .status(401)
        .json({ message: "Account is deactivated. Contact the admin." });
    }
    req.user = { id: user._id.toString(), role: user.role };
    next();
  } catch {
    return res.status(500).json({ message: "Authentication check failed" });
  }
}

function requireAdmin(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}

module.exports = { authenticateToken, requireAdmin };
