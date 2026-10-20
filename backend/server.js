const path = require("path");
const fs = require("fs");
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

// The shop and its daily reports operate in Indian Standard Time. Render
// provides Linux timezone support; the env var in render.yaml makes this
// explicit, and this default keeps local/production date buckets consistent.
process.env.TZ = process.env.TZ || "Asia/Kolkata";

const { connectDB } = require("./config/db");

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const productRoutes = require("./routes/products");
const supplierRoutes = require("./routes/suppliers");
const transactionRoutes = require("./routes/Transactions");
const returnRoutes = require("./routes/returns");
const ledgerRoutes = require("./routes/ledger");
const reportRoutes = require("./routes/reports");

const app = express();

app.use(cors());
app.use(express.json());

// Always answers 200 so a database blip doesn't make Render fail the deploy,
// but reports the live connection state so a broken DB is visible at a glance.
app.get("/api/health", (req, res) => {
  const state = mongoose.connection.readyState; // 1 = connected
  res.json({
    status: state === 1 ? "ok" : "degraded",
    db: state === 1 ? "connected" : "disconnected",
    time: new Date().toISOString(),
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/returns", returnRoutes);
app.use("/api/ledger", ledgerRoutes);
app.use("/api/reports", reportRoutes);

// Serve the built frontend (single-service deploy) with SPA fallback.
const distPath = path.join(__dirname, "..", "frontend", "dist");
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
} else {
  // Frontend not built yet (backend-only dev mode)
  app.get("/", (req, res) => {
    res.send("POS Billing Software API is running! Build the frontend (npm run build in frontend/) to serve the UI.");
  });
}

async function start() {
  try {
    const { inMemory } = await connectDB();

    if (!process.env.JWT_SECRET) {
      if (process.env.NODE_ENV === "production") {
        throw new Error("JWT_SECRET must be set in production");
      }
      process.env.JWT_SECRET = "posflow-local-dev-only-secret";
      console.warn(
        "JWT_SECRET is not set - using a development-only secret. Set JWT_SECRET for production."
      );
    }

    // A fresh database (new Atlas cluster, or the in-memory dev fallback)
    // starts empty, so seed the demo accounts/products once. This keeps a
    // just-deployed instance immediately testable.
    if (process.env.SEED_DEMO_DATA !== "false") {
      const User = require("./models/user");
      const userCount = await User.countDocuments();
      if (userCount === 0) {
        console.log(
          `Empty database${inMemory ? " (in-memory)" : ""} - seeding demo data...`
        );
        const { seedDatabase } = require("./lib/seedData");
        await seedDatabase();
      }
    }

    const port = process.env.PORT || 5000;
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
}

start();
