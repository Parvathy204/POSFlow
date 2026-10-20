const express = require("express");
const Product = require("../models/Product");
const {
  authenticateToken,
  requireAdmin,
} = require("../middleware/auth");

const router = express.Router();

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

router.use(authenticateToken);

// View all products (any signed-in user - the billing portal needs this)
router.get("/", async (req, res) => {
  try {
    const { search, category, lowStock } = req.query;

    const filter = {};
    if (search?.trim()) {
      const term = new RegExp(escapeRegex(search.trim()), "i");
      filter.$or = [{ name: term }, { sku: term }];
    }
    if (category) filter.category = category;
    if (lowStock === "true") {
      filter.$expr = {
        $lte: ["$stock", { $ifNull: ["$lowStockThreshold", 5] }],
      };
    }

    const products = await Product.find(filter)
      .sort({ createdAt: -1 })
      .populate("supplier", "name");

    res.json(products);
  } catch {
    res.status(500).json({ message: "Could not fetch products" });
  }
});

// Everything below is admin-only
router.use(requireAdmin);

// Add product
router.post("/", async (req, res) => {
  try {
    const { name, sku, category, size, price, costPrice, stock, lowStockThreshold, supplier } =
      req.body;

    if (
      !name?.trim() ||
      !sku?.trim() ||
      !category?.trim() ||
      price === undefined ||
      stock === undefined ||
      !Number.isFinite(Number(price)) ||
      Number(price) < 0 ||
      !Number.isInteger(Number(stock)) ||
      Number(stock) < 0
    ) {
      return res.status(400).json({
        message: "Enter valid product details, price and whole-number stock",
      });
    }

    const product = await Product.create({
      name: name.trim(),
      sku: sku.trim(),
      category: category.trim(),
      size: size || "Free Size",
      price: Number(price),
      costPrice: Number(costPrice) || 0,
      stock: Number(stock),
      lowStockThreshold:
        Number.isInteger(Number(lowStockThreshold)) && Number(lowStockThreshold) >= 0
          ? Number(lowStockThreshold)
          : 5,
      supplier: supplier || null,
    });

    res.status(201).json(product);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "SKU already exists" });
    }
    res.status(500).json({ message: "Could not create product" });
  }
});

// Edit product
router.put("/:id", async (req, res) => {
  try {
    const { name, sku, category, size, price, costPrice, stock, lowStockThreshold, supplier, isActive } =
      req.body;

    if (
      !name?.trim() ||
      !sku?.trim() ||
      !category?.trim() ||
      price === undefined ||
      stock === undefined ||
      !Number.isFinite(Number(price)) ||
      Number(price) < 0 ||
      !Number.isInteger(Number(stock)) ||
      Number(stock) < 0
    ) {
      return res.status(400).json({ message: "Invalid product details" });
    }

    const update = {
      name: name.trim(),
      sku: sku.trim(),
      category: category.trim(),
      size: size || "Free Size",
      price: Number(price),
      costPrice: Number(costPrice) || 0,
      stock: Number(stock),
    };
    if (lowStockThreshold !== undefined) {
      update.lowStockThreshold = Number(lowStockThreshold);
    }
    if (supplier !== undefined) update.supplier = supplier || null;
    if (isActive !== undefined) update.isActive = Boolean(isActive);

    const product = await Product.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "SKU already exists" });
    }
    res.status(500).json({ message: "Could not update product" });
  }
});

// Delete product
router.delete("/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({ message: "Product deleted successfully" });
  } catch {
    res.status(400).json({ message: "Invalid product ID" });
  }
});

module.exports = router;
