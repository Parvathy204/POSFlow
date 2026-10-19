const express = require("express");
const LedgerEntry = require("../models/LedgerEntry");
const { authenticateToken, requireAdmin } = require("../middleware/auth");

const router = express.Router();

router.use(authenticateToken, requireAdmin);

// List ledger entries with optional date-range filter, plus running totals
router.get("/", async (req, res) => {
  try {
    const { from, to, type } = req.query;

    const filter = {};
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) {
        const endDate = new Date(to);
        endDate.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = endDate;
      }
    }
    if (type) filter.type = type;

    const [entries, totals] = await Promise.all([
      LedgerEntry.find(filter)
        .sort({ createdAt: -1 })
        .limit(500)
        .populate("createdBy", "name"),
      LedgerEntry.aggregate([
        { $match: filter },
        {
          $group: {
            _id: "$direction",
            total: { $sum: "$amount" },
          },
        },
      ]),
    ]);

    let credits = 0;
    let debits = 0;
    for (const t of totals) {
      if (t._id === "credit") credits = t.total;
      if (t._id === "debit") debits = t.total;
    }

    res.json({
      entries,
      summary: {
        credits,
        debits,
        balance: credits - debits,
      },
    });
  } catch {
    res.status(500).json({ message: "Could not fetch ledger" });
  }
});

// Manually add an entry (expense / capital / adjustment)
router.post("/", async (req, res) => {
  try {
    const { type, amount, description, category } = req.body;

    if (!["Expense", "Capital", "Adjustment"].includes(type)) {
      return res.status(400).json({
        message: "Manual entries must be Expense, Capital or Adjustment",
      });
    }

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ message: "Amount must be greater than zero" });
    }

    if (!description?.trim()) {
      return res.status(400).json({ message: "Description is required" });
    }

    const direction = type === "Capital" ? "credit" : "debit";

    const entry = await LedgerEntry.create({
      type,
      direction,
      amount: numericAmount,
      description: description.trim(),
      category: category || "",
      createdBy: req.user.id,
    });

    res.status(201).json(entry);
  } catch {
    res.status(500).json({ message: "Could not create ledger entry" });
  }
});

module.exports = router;
