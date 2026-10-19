const mongoose = require("mongoose");

/**
 * A product return raised against an original sales transaction.
 * Restocks the returned items and records a refund in the ledger.
 */
const returnSchema = new mongoose.Schema(
  {
    returnNumber: {
      type: String,
      required: true,
      unique: true,
    },
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transaction",
      required: true,
    },
    invoiceNumber: {
      type: String,
      required: true,
    },
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        name: {
          type: String,
          required: true,
        },
        sku: {
          type: String,
          required: true,
        },
        price: {
          type: Number,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        subtotal: {
          type: Number,
          required: true,
        },
      },
    ],
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    refundMethod: {
      type: String,
      enum: ["Cash", "UPI", "Card"],
      required: true,
    },
    refundAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Return", returnSchema);
