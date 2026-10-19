/**
 * Seeds the database with demo data.
 * Run with: npm run seed
 */
const mongoose = require("mongoose");
require("dotenv").config();

const { connectDB } = require("./config/db");
const { seedDatabase } = require("./lib/seedData");

async function seed() {
  await connectDB();
  await seedDatabase();
  console.log("\nSeed complete!");
  await mongoose.disconnect();
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
