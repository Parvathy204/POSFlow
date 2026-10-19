const express = require("express");
const mongoose = require("mongoose");
const Return = require("../models/Return");
const Transaction = require("../models/Transaction");
const Product = require("../models/Product");
const LedgerEntry = require("../models/LedgerEntry");
const { authenticateToken, requireAdmin } = require("../middleware/auth");
const { runInTransaction } = require("../lib/txn");

const router = express.Router();

router.use(authenticateToken, requireAdmin);

// List returns (newest first)
router.get("/", async (req, res) => {
  try {
    const returns = await Return.find()
      .sort({ createdAt: -1 })
      .populate("processedBy", "name");
    res.json(returns);
  } catch {
    res.status(500).json({ message: "Could not fetch returns" });
  }
});

// Create a return against an invoice
router.post("/", async (req, res) => {
  const { transactionId, items, reason, refundMethod } = req.body;

  if (!mongoose.isValidObjectId(transactionId)) {
    return res.status(400).json({ message: "Invalid transaction ID" });
  }

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "Select at least one item to return" });
  }

  if (!reason?.trim()) {
    return res.status(400).json({ message: "A return reason is required" });
  }

  if (!["Cash", "UPI", "Card"].includes(refundMethod)) {
    return res.status(400).json({ message: "Select a valid refund method" });
  }

  try {
    const savedReturn = await runInTransaction(async (session) => {
      const transaction = await Transaction.findById(transactionId).session(session);

      if (!transaction) {
        throw new Error("Original invoice not found");
      }
      if (transaction.status === "Cancelled") {
        throw new Error("Cannot return items from a cancelled invoice");
      }

      let refundAmount = 0;
      const returnItems = [];

      for (const item of items) {
        const quantity = Number(item.quantity);

        if (!mongoose.isValidObjectId(item.productId) || !Number.isInteger(quantity) || quantity < 1) {
          throw new Error("Invalid product or quantity in return");
        }

        const line = transaction.items.find(
          (i) => i.productId.toString() === String(item.productId)
        );

        if (!line) {
          throw new Error("One of the selected items is not part of this invoice");
        }

        const alreadyReturned = line.returnedQuantity || 0;
        if (alreadyReturned + quantity > line.quantity) {
          throw new Error(
            `Cannot return ${quantity} x ${line.name}: only ${line.quantity - alreadyReturned} remaining to return`
          );
        }

        line.returnedQuantity = alreadyReturned + quantity;
        const subtotal = line.price * quantity;
        refundAmount += subtotal;

        returnItems.push({
          productId: line.productId,
          name: line.name,
          sku: line.sku,
          price: line.price,
          quantity,
          subtotal,
        });

        // Restock the product
        await Product.findByIdAndUpdate(
          line.productId,
          { $inc: { stock: quantity } },
          { session }
        );
      }

      // Update transaction totals and status
      const fullyReturned = transaction.items.every(
        (i) => (i.returnedQuantity || 0) >= i.quantity
      );

      transaction.refundAmount = (transaction.refundAmount || 0) + refundAmount;
      transaction.status = fullyReturned ? "Returned" : "Partially Returned";
      await transaction.save({ session });

      const returnNumber = `RET-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      const [created] = await Return.create(
        [
          {
            returnNumber,
            transactionId: transaction._id,
            invoiceNumber: transaction.invoiceNumber,
            items: returnItems,
            reason: reason.trim(),
            refundMethod,
            refundAmount,
            processedBy: req.user.id,
          },
        ],
        { session }
      );

      await LedgerEntry.create(
        [
          {
            type: "Refund",
            direction: "debit",
            amount: refundAmount,
            description: `Refund for ${transaction.invoiceNumber} (${returnNumber})`,
            transactionId: transaction._id,
            returnId: created._id,
            createdBy: req.user.id,
            category: "Return",
          },
        ],
        { session }
      );

      return created;
    });

    const populated = await Return.findById(savedReturn._id).populate(
      "processedBy",
      "name"
    );

    return res.status(201).json({
      message: "Return processed successfully",
      return: populated,
    });
  } catch (error) {
    return res.status(400).json({
      message: error.message || "Could not process the return",
    });
  }
});

module.exports = router;
