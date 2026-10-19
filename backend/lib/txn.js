const mongoose = require("mongoose");

/**
 * Multi-document transactions need a replica set (MongoDB Atlas, prod)
 * or mongos. A plain local `mongod` standalone does not support them.
 *
 * We probe once at startup: if transactions are unsupported, `runInTransaction`
 * simply executes the callback with a null session (Mongoose ignores null
 * sessions), so sales/returns still work on a standalone server - without the
 * atomicity guarantee, which is acceptable for local development.
 */
let transactionsSupported = null;

async function detectTransactionSupport() {
  if (transactionsSupported !== null) return transactionsSupported;
  try {
    // Replica set members advertise `setName`; mongos advertises
    // msg: "isdbgrid". A plain standalone mongod has neither, and it is the
    // only topology that rejects multi-document transactions.
    const hello = await mongoose.connection.db.admin().command({ hello: 1 });
    transactionsSupported = Boolean(hello.setName || hello.msg === "isdbgrid");
  } catch {
    transactionsSupported = false;
  }
  if (!transactionsSupported) {
    console.warn(
      "MongoDB server does not support multi-document transactions " +
        "(standalone mongod). Running without transaction atomicity - " +
        "fine for local dev; use a replica set / Atlas in production."
    );
  }
  return transactionsSupported;
}

/**
 * Runs `fn(session)` inside a MongoDB transaction when the server supports
 * it, otherwise runs `fn(null)` directly. Returns fn's return value.
 */
async function runInTransaction(fn) {
  const supported = await detectTransactionSupport();

  if (!supported) {
    return fn(null);
  }

  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      result = await fn(session);
    });
    return result;
  } finally {
    await session.endSession();
  }
}

module.exports = { runInTransaction, detectTransactionSupport };
