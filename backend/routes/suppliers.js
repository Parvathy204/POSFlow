const express = require("express");
const Supplier = require("../models/Supplier");
const { authenticateToken, requireAdmin } = require("../middleware/auth");

const router = express.Router();

router.use(authenticateToken, requireAdmin);

// List suppliers
router.get("/", async (req, res) => {
  try {
    const suppliers = await Supplier.find().sort({ createdAt: -1 });
    res.json(suppliers);
  } catch {
    res.status(500).json({ message: "Could not fetch suppliers" });
  }
});

// Create supplier
router.post("/", async (req, res) => {
  try {
    const { name, contactPerson, phone, email, address, gstNumber, notes } =
      req.body;

    if (!name?.trim() || !phone?.trim()) {
      return res
        .status(400)
        .json({ message: "Supplier name and phone are required" });
    }

    const supplier = await Supplier.create({
      name: name.trim(),
      contactPerson: contactPerson || "",
      phone: phone.trim(),
      email: email || "",
      address: address || "",
      gstNumber: gstNumber || "",
      notes: notes || "",
    });

    res.status(201).json(supplier);
  } catch {
    res.status(500).json({ message: "Could not create supplier" });
  }
});

// Update supplier
router.put("/:id", async (req, res) => {
  try {
    const { name, contactPerson, phone, email, address, gstNumber, notes, balanceOwed, isActive } =
      req.body;

    if (name !== undefined && !name.trim()) {
      return res.status(400).json({ message: "Name cannot be empty" });
    }
    if (phone !== undefined && !phone.trim()) {
      return res.status(400).json({ message: "Phone cannot be empty" });
    }

    const update = {};
    if (name !== undefined) update.name = name.trim();
    if (contactPerson !== undefined) update.contactPerson = contactPerson;
    if (phone !== undefined) update.phone = phone.trim();
    if (email !== undefined) update.email = email;
    if (address !== undefined) update.address = address;
    if (gstNumber !== undefined) update.gstNumber = gstNumber;
    if (notes !== undefined) update.notes = notes;
    if (balanceOwed !== undefined) update.balanceOwed = Number(balanceOwed) || 0;
    if (isActive !== undefined) update.isActive = Boolean(isActive);

    const supplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true, runValidators: true }
    );

    if (!supplier) {
      return res.status(404).json({ message: "Supplier not found" });
    }

    res.json(supplier);
  } catch {
    res.status(500).json({ message: "Could not update supplier" });
  }
});

// Delete supplier
router.delete("/:id", async (req, res) => {
  try {
    const supplier = await Supplier.findByIdAndDelete(req.params.id);
    if (!supplier) {
      return res.status(404).json({ message: "Supplier not found" });
    }
    res.json({ message: "Supplier deleted" });
  } catch {
    res.status(400).json({ message: "Invalid supplier ID" });
  }
});

module.exports = router;
