/**
 * Seeds the database with demo data.
 * Run with: npm run seed            (only seeds an empty database)
 *           npm run seed -- --force (wipes existing data, then seeds)
 */
const mongoose = require("mongoose");
require("dotenv").config();

const { connectDB } = require("./config/db");
const { seedDatabase } = require("./lib/seedData");

async function seed() {
  await connectDB();
  const force = process.argv.includes("--force");
  const result = await seedDatabase({ force });
  console.log(result.skipped ? "\nSeed skipped (data already present)." : "\nSeed complete!");
  await mongoose.disconnect();
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
