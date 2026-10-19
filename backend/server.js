const path = require("path");
const fs = require("fs");
const express = require("express");
const cors = require("cors");
require("dotenv").config();

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

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
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

    // The in-memory fallback starts empty every run, so auto-seed it once so
    // the demo accounts and products always exist for reviewers.
    if (inMemory) {
      const User = require("./models/user");
      const userCount = await User.countDocuments();
      if (userCount === 0) {
        console.log("Empty in-memory database - seeding demo data...");
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
