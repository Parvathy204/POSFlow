const express = require("express");
const Transaction = require("../models/Transaction");
const Product = require("../models/Product");
const User = require("../models/user");
const LedgerEntry = require("../models/LedgerEntry");
const { authenticateToken, requireAdmin } = require("../middleware/auth");

const router = express.Router();

router.use(authenticateToken, requireAdmin);

// Dashboard summary: KPIs, recent sales, low stock
router.get("/dashboard", async (req, res) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [todayAgg, monthAgg, totalProducts, lowStock, staffCount, recent, monthlyCount] =
      await Promise.all([
        Transaction.aggregate([
          { $match: { createdAt: { $gte: startOfToday }, status: { $ne: "Cancelled" } } },
          { $group: { _id: null, total: { $sum: "$totalAmount" }, count: { $sum: 1 } } },
        ]),
        Transaction.aggregate([
          { $match: { createdAt: { $gte: startOfMonth }, status: { $ne: "Cancelled" } } },
          { $group: { _id: null, total: { $sum: "$totalAmount" }, count: { $sum: 1 } } },
        ]),
        Product.countDocuments({ isActive: true }),
        Product.find({
          isActive: true,
          $expr: { $lte: ["$stock", { $ifNull: ["$lowStockThreshold", 5] }] },
        })
          .sort({ stock: 1 })
          .limit(10)
          .select("name sku stock price"),
        User.countDocuments({ role: "staff", isActive: true }),
        Transaction.find()
          .sort({ createdAt: -1 })
          .limit(8)
          .populate("staffId", "name"),
        Transaction.countDocuments({ createdAt: { $gte: startOfMonth }, status: { $ne: "Cancelled" } }),
      ]);

    res.json({
      todaySales: todayAgg[0]?.total || 0,
      todayBills: todayAgg[0]?.count || 0,
      monthSales: monthAgg[0]?.total || 0,
      monthBills: monthlyCount,
      totalProducts,
      lowStock,
      staffCount,
      recent,
    });
  } catch {
    res.status(500).json({ message: "Could not load dashboard summary" });
  }
});

// Sales report for a date range, grouped by day + payment method + top products
router.get("/sales", async (req, res) => {
  try {
    const { from, to } = req.query;

    const startDate = from ? new Date(from) : new Date(Date.now() - 29 * 86400000);
    const endDate = to ? new Date(to) : new Date();
    endDate.setHours(23, 59, 59, 999);

    const match = {
      createdAt: { $gte: startDate, $lte: endDate },
      status: { $ne: "Cancelled" },
    };

    const [byDay, byMethod, topProducts, totals, costAgg] = await Promise.all([
      Transaction.aggregate([
        { $match: match },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            sales: { $sum: "$totalAmount" },
            bills: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Transaction.aggregate([
        { $match: match },
        {
          $group: {
            _id: "$paymentMethod",
            total: { $sum: "$totalAmount" },
            count: { $sum: 1 },
          },
        },
      ]),
      Transaction.aggregate([
        { $match: match },
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.name",
            quantity: { $sum: "$items.quantity" },
            revenue: { $sum: "$items.subtotal" },
          },
        },
        { $sort: { revenue: -1 } },
        { $limit: 10 },
      ]),
      Transaction.aggregate([
        { $match: match },
        {
          $group: {
            _id: null,
            revenue: { $sum: "$totalAmount" },
            discounts: { $sum: "$discount" },
            tax: { $sum: "$taxAmount" },
            refunds: { $sum: "$refundAmount" },
            bills: { $sum: 1 },
          },
        },
      ]),
      // Cost of goods sold - $unwind approach works on older MongoDB
      // servers too (no $reduce inside $group).
      Transaction.aggregate([
        { $match: match },
        { $unwind: "$items" },
        {
          $group: {
            _id: null,
            cost: {
              $sum: {
                $multiply: [
                  {
                    $subtract: [
                      "$items.quantity",
                      { $ifNull: ["$items.returnedQuantity", 0] },
                    ],
                  },
                  "$items.costPrice",
                ],
              },
            },
          },
        },
      ]),
    ]);

    const t = totals[0] || {};
    const cost = costAgg[0]?.cost || 0;

    res.json({
      range: { from: startDate, to: endDate },
      byDay,
      byMethod,
      topProducts,
      totals: {
        revenue: t.revenue || 0,
        discounts: t.discounts || 0,
        tax: t.tax || 0,
        refunds: t.refunds || 0,
        bills: t.bills || 0,
        grossProfit: (t.revenue || 0) - (t.tax || 0) - cost,
      },
    });
  } catch {
    res.status(500).json({ message: "Could not build sales report" });
  }
});

// Staff performance report
router.get("/staff", async (req, res) => {
  try {
    const { from, to } = req.query;
    const startDate = from ? new Date(from) : new Date(Date.now() - 29 * 86400000);
    const endDate = to ? new Date(to) : new Date();
    endDate.setHours(23, 59, 59, 999);

    const performance = await Transaction.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate }, status: { $ne: "Cancelled" } } },
      {
        $group: {
          _id: "$staffId",
          sales: { $sum: "$totalAmount" },
          bills: { $sum: 1 },
        },
      },
      { $sort: { sales: -1 } },
    ]);

    const users = await User.find({ _id: { $in: performance.map((p) => p._id).filter(Boolean) } })
      .select("name role");

    const nameMap = new Map(users.map((u) => [String(u._id), u]));

    res.json(
      performance.map((p) => ({
        staff: p._id ? nameMap.get(String(p._id))?.name || "Deleted user" : "Unknown",
        role: p._id ? nameMap.get(String(p._id))?.role || "" : "",
        sales: p.sales,
        bills: p.bills,
      }))
    );
  } catch {
    res.status(500).json({ message: "Could not build staff report" });
  }
});

// Inventory valuation + low stock
router.get("/inventory", async (req, res) => {
  try {
    const [stats, lowStock, byCategory] = await Promise.all([
      Product.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: null,
            skus: { $sum: 1 },
            units: { $sum: "$stock" },
            retailValue: { $sum: { $multiply: ["$stock", "$price"] } },
            costValue: { $sum: { $multiply: ["$stock", "$costPrice"] } },
          },
        },
      ]),
      Product.find({
        isActive: true,
        $expr: { $lte: ["$stock", { $ifNull: ["$lowStockThreshold", 5] }] },
      }).sort({ stock: 1 }),
      Product.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: "$category",
            skus: { $sum: 1 },
            units: { $sum: "$stock" },
            value: { $sum: { $multiply: ["$stock", "$price"] } },
          },
        },
        { $sort: { value: -1 } },
      ]),
    ]);

    res.json({
      stats: stats[0] || { skus: 0, units: 0, retailValue: 0, costValue: 0 },
      lowStock,
      byCategory,
    });
  } catch {
    res.status(500).json({ message: "Could not build inventory report" });
  }
});

module.exports = router;
