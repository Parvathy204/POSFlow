const mongoose = require("mongoose");

/**
 * Double-entry-style ledger of all money movements in the store.
 * - Sale          : income from a completed sale
 * - Refund        : money returned to a customer for a product return
 * - Expense       : store expense (rent, utilities, salaries, purchases...)
 * - Capital       : owner's capital injected into the business
 * - Adjustment    : manual correction
 */
const ledgerEntrySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["Sale", "Refund", "Expense", "Capital", "Adjustment"],
      required: true,
    },
    // "credit" adds to the store's cash balance, "debit" removes from it.
    direction: {
      type: String,
      enum: ["credit", "debit"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    // Optional links back to source documents.
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transaction",
      default: null,
    },
    returnId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Return",
      default: null,
    },
    // Who created the entry (null = system generated).
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    // Free-form category for expenses, e.g. "Rent", "Salary", "Utilities".
    category: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("LedgerEntry", ledgerEntrySchema);
