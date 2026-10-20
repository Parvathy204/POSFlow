/**
 * Copies a local POSFlow database into the database configured by MONGO_URI.
 *
 * The deployed app (Atlas) starts empty and auto-seeds demo data, which hides
 * any real data you entered while running locally. This script replaces the
 * demo dataset in the target with the contents of your local database.
 *
 * Usage:
 *   node scripts/migrate-local-data.js --dry-run
 *   node scripts/migrate-local-data.js
 *   node scripts/migrate-local-data.js --from mongodb://127.0.0.1:27017/pos_billing
 *   node scripts/migrate-local-data.js --to   mongodb://host/posflow   (overrides MONGO_URI)
 *
 * Before writing anything it saves the current target contents to
 * ./.backup/<db>-<timestamp>.json so the operation can be undone.
 */
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config();

const COLLECTIONS = [
  "users",
  "products",
  "suppliers",
  "transactions",
  "returns",
  "ledgerentries",
];

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const DRY_RUN = process.argv.includes("--dry-run");
const SOURCE = arg("from", "mongodb://127.0.0.1:27017/pos_billing");
const TARGET = arg("to", process.env.MONGO_URI);

function label(uri) {
  try {
    const url = new URL(uri);
    return `${url.hostname}${url.pathname || ""}`;
  } catch {
    return "(invalid uri)";
  }
}

async function snapshot(db, labelText) {
  const data = {};
  for (const name of COLLECTIONS) {
    data[name] = await db.collection(name).find({}).toArray();
  }
  const dir = path.join(__dirname, "..", "..", ".backup");
  fs.mkdirSync(dir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const file = path.join(dir, `${labelText}-${stamp}.json`);
  fs.writeFileSync(file, JSON.stringify(data, null, 1));
  return { data, file };
}

function counts(data) {
  return Object.entries(data)
    .map(([name, docs]) => `${name}=${docs.length}`)
    .join(" ");
}

async function main() {
  if (!TARGET) {
    throw new Error("MONGO_URI is not set. Pass --to <uri> or configure backend/.env.");
  }

  const source = await mongoose.createConnection(SOURCE, {
    serverSelectionTimeoutMS: 6000,
  }).asPromise();
  const target = await mongoose.createConnection(TARGET, {
    serverSelectionTimeoutMS: 8000,
  }).asPromise();

  const sourceData = {};
  for (const name of COLLECTIONS) {
    sourceData[name] = await source.db.collection(name).find({}).toArray();
  }

  const sourceUsers = sourceData.users.length;
  if (sourceUsers === 0) {
    throw new Error(`No users found in source (${label(SOURCE)}) - refusing to overwrite the target.`);
  }
  console.log(`source ${label(SOURCE)}: ${counts(sourceData)}`);

  const before = await snapshot(target.db, `${target.db.databaseName}`);
  console.log(`target ${label(TARGET)}: ${counts(before.data)}`);
  console.log(`target backup written to ${before.file}`);

  if (DRY_RUN) {
    console.log("\n--dry-run: nothing written. Target would be replaced with the source data above.");
    await source.close();
    await target.close();
    return;
  }

  for (const name of COLLECTIONS) {
    const docs = sourceData[name];
    await target.db.collection(name).deleteMany({});
    if (docs.length > 0) {
      await target.db.collection(name).insertMany(docs, { ordered: true });
    }
    const verify = await target.db.collection(name).countDocuments();
    console.log(`  ${name}: ${verify}/${docs.length} copied`);
    if (verify !== docs.length) {
      throw new Error(`Copy mismatch for ${name}: expected ${docs.length}, found ${verify}`);
    }
  }

  console.log("\nMigration complete - the target now holds your original data.");
  console.log(`To undo, restore from ${before.file} (JSON dump: mongoimport).`);

  await source.close();
  await target.close();
}

main().catch(async (error) => {
  console.error("Migration failed:", error.message);
  try {
    await mongoose.disconnect();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
