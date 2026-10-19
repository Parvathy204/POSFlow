const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const Transaction = require("../models/Transaction");
const Product = require("../models/Product");
const LedgerEntry = require("../models/LedgerEntry");
const { authenticateToken, requireAdmin } = require("../middleware/auth");
const { runInTransaction } = require("../lib/txn");

router.get("/test", (req, res) => {
  res.json({ message: "Transactions route is working!" });
});

router.use(authenticateToken);

// List transactions. Admins see everything; staff see only their own.
router.get("/", async (req, res) => {
  try {
    const { from, to, paymentMethod, status } = req.query;

    const filter = {};
    if (req.user.role !== "admin") {
      filter.staffId = new mongoose.Types.ObjectId(req.user.id);
    }
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) {
        const endDate = new Date(to);
        endDate.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = endDate;
      }
    }
    if (paymentMethod) filter.paymentMethod = paymentMethod;
    if (status) filter.status = status;

    const transactions = await Transaction.find(filter)
      .sort({ createdAt: -1 })
      .limit(200)
      .populate("staffId", "name role");

    res.json(transactions);
  } catch {
    res.status(500).json({ message: "Could not fetch transactions" });
  }
});

// Single transaction detail (admins or the staff member who billed it)
router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid transaction ID" });
    }

    const transaction = await Transaction.findById(req.params.id).populate(
      "staffId",
      "name"
    );

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    if (
      req.user.role !== "admin" &&
      transaction.staffId?._id?.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: "Not allowed" });
    }

    res.json(transaction);
  } catch {
    res.status(500).json({ message: "Could not fetch transaction" });
  }
});

// Create a sale (billing portal)
router.post("/", async (req, res) => {
  const { items, paymentMethod, customerName, customerPhone, discount, taxRate, amountPaid } =
    req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "Add at least one product." });
  }

  if (!["Cash", "UPI", "Card"].includes(paymentMethod)) {
    return res.status(400).json({ message: "Select a valid payment method." });
  }

  const numericDiscount = Number(discount) || 0;
  const numericTaxRate = Number(taxRate) || 0;
  if (numericDiscount < 0 || numericTaxRate < 0 || numericTaxRate > 100) {
    return res.status(400).json({ message: "Invalid discount or tax rate." });
  }

  const quantities = new Map();

  for (const item of items) {
    const quantity = Number(item.quantity);

    if (
      !mongoose.isValidObjectId(item.productId) ||
      !Number.isInteger(quantity) ||
      quantity < 1
    ) {
      return res.status(400).json({ message: "Invalid product or quantity." });
    }

    const id = String(item.productId);
    quantities.set(id, (quantities.get(id) || 0) + quantity);
  }

  try {
    const savedTransaction = await runInTransaction(async (session) => {
      const receiptItems = [];
      let subtotal = 0;

      for (const [productId, quantity] of quantities) {
        const product = await Product.findById(productId).session(session);

        if (!product) {
          throw new Error("A selected product no longer exists.");
        }

        if (product.stock < quantity) {
          throw new Error(`Insufficient stock for ${product.name}.`);
        }

        const price = Number(product.price);
        const lineSubtotal = price * quantity;

        product.stock -= quantity;
        await product.save({ session });

        receiptItems.push({
          productId: product._id,
          name: product.name,
          sku: product.sku,
          price,
          costPrice: Number(product.costPrice) || 0,
          quantity,
          subtotal: lineSubtotal,
        });

        subtotal += lineSubtotal;
      }

      const discountAmount = Math.min(numericDiscount, subtotal);
      const taxable = subtotal - discountAmount;
      const taxAmount = Math.round(taxable * numericTaxRate) / 100;
      const totalAmount = taxable + taxAmount;

      const paid = paymentMethod === "Cash" ? Number(amountPaid) || totalAmount : totalAmount;
      const changeReturned = paid > totalAmount ? paid - totalAmount : 0;

      const invoiceNumber = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      const transaction = new Transaction({
        invoiceNumber,
        items: receiptItems,
        customerName: customerName?.trim() || "Walk-in Customer",
        customerPhone: customerPhone?.trim() || "",
        subtotal,
        discount: discountAmount,
        taxAmount,
        totalAmount,
        paymentMethod,
        amountPaid: paid,
        changeReturned,
        staffId: req.user?.id || null,
        status: "Completed",
      });

      const saved = await transaction.save({ session });

      await LedgerEntry.create(
        [
          {
            type: "Sale",
            direction: "credit",
            amount: totalAmount,
            description: `Sale ${invoiceNumber}`,
            transactionId: saved._id,
            createdBy: req.user?.id || null,
            category: paymentMethod,
          },
        ],
        { session }
      );

      return saved;
    });

    return res.status(201).json({
      message: "Sale completed successfully.",
      transaction: savedTransaction,
    });
  } catch (error) {
    return res.status(400).json({
      message: error.message || "Could not complete the sale.",
    });
  }
});

// Cancel a transaction: restock items and reverse the ledger entry
router.post("/:id/cancel", requireAdmin, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid transaction ID" });
  }

  try {
    const result = await runInTransaction(async (session) => {
      const transaction = await Transaction.findById(req.params.id).session(session);

      if (!transaction) {
        throw new Error("Transaction not found");
      }
      if (transaction.status === "Cancelled") {
        throw new Error("Transaction is already cancelled");
      }
      if (transaction.status !== "Completed") {
        throw new Error(
          "Only fully completed transactions can be cancelled. Process a return instead."
        );
      }

      for (const item of transaction.items) {
        await Product.findByIdAndUpdate(
          item.productId,
          { $inc: { stock: item.quantity } },
          { session }
        );
      }

      transaction.status = "Cancelled";
      await transaction.save({ session });

      await LedgerEntry.create(
        [
          {
            type: "Adjustment",
            direction: "debit",
            amount: transaction.totalAmount,
            description: `Cancelled invoice ${transaction.invoiceNumber}`,
            transactionId: transaction._id,
            createdBy: req.user.id,
            category: "Cancellation",
          },
        ],
        { session }
      );

      return transaction;
    });

    res.json({ message: "Transaction cancelled and stock restored", transaction: result });
  } catch (error) {
    res.status(400).json({ message: error.message || "Could not cancel transaction" });
  }
});

module.exports = router;
