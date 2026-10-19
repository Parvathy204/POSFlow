const mongoose = require("mongoose");

/**
 * Connects to MongoDB.
 *
 * - Production: uses MONGO_URI (e.g. MongoDB Atlas on Render).
 * - Local dev : if MONGO_URI is missing OR unreachable, falls back to an
 *               in-memory MongoDB replica set (mongodb-memory-server) so the
 *               app always runs out of the box. Data lives in RAM and is
 *               repopulated by `npm run seed`.
 */
async function connectDB() {
  const uri = process.env.MONGO_URI;
  const allowFallback = process.env.NODE_ENV !== "production";

  mongoose.set("strictQuery", true);

  if (uri) {
    try {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 6000 });
      console.log(`MongoDB connected: ${redact(uri)}`);
      return;
    } catch (error) {
      if (!allowFallback) throw error;
      console.warn(
        `Could not reach MONGO_URI (${redact(uri)}): ${error.message}`
      );
      console.warn("Falling back to an in-memory MongoDB for development...");
    }
  } else if (!allowFallback) {
    throw new Error("MONGO_URI must be set in production");
  } else {
    console.log("MONGO_URI not set - starting in-memory MongoDB (dev mode)");
  }

  const { MongoMemoryReplSet } = require("mongodb-memory-server");
  const replSet = await MongoMemoryReplSet.create({
    replSet: { count: 1 },
  });

  // Mongoose transactions require a replica set, hence MongoMemoryReplSet.
  await mongoose.connect(replSet.getUri("posflow"));
  console.log("In-memory MongoDB (replica set) ready");
}

function redact(uri) {
  try {
    const url = new URL(uri);
    return `${url.protocol}//${url.hostname}:${url.port || "default"}`;
  } catch {
    return "(invalid uri)";
  }
}

module.exports = { connectDB };
