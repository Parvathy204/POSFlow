/**
 * Seeds the database with demo data:
 *  - Admin + staff accounts
 *  - Suppliers
 *  - Textile products
 *  - Sample sales transactions from the last 14 days (+ ledger entries)
 *  - A sample return
 *
 * Reusable: `backend/seed.js` calls this for `npm run seed`, and the server
 * calls it automatically when the database is empty.
 *
 * Non-destructive by default: if any user already exists the seed is skipped,
 * so real data is never overwritten. Pass { force: true } (CLI: --force) to
 * wipe the collections and re-create the demo dataset.
 */
const bcrypt = require("bcryptjs");

const User = require("../models/user");
const Product = require("../models/Product");
const Supplier = require("../models/Supplier");
const Transaction = require("../models/Transaction");
const Return = require("../models/Return");
const LedgerEntry = require("../models/LedgerEntry");

const PRODUCTS = [
  { name: "Cotton Casual Shirt - Blue", sku: "SHT-BLU-M", category: "Shirts", size: "M", price: 799, costPrice: 450, stock: 42 },
  { name: "Cotton Casual Shirt - White", sku: "SHT-WHT-L", category: "Shirts", size: "L", price: 799, costPrice: 450, stock: 35 },
  { name: "Denim Jeans - Dark Wash", sku: "JNS-DRK-32", category: "Jeans", size: "32", price: 1299, costPrice: 800, stock: 28 },
  { name: "Denim Jeans - Light Wash", sku: "JNS-LGT-30", category: "Jeans", size: "30", price: 1299, costPrice: 800, stock: 22 },
  { name: "Silk Saree - Maroon", sku: "SAR-MRN-01", category: "Sarees", size: "Free Size", price: 2499, costPrice: 1500, stock: 15 },
  { name: "Silk Saree - Emerald", sku: "SAR-EMR-02", category: "Sarees", size: "Free Size", price: 2799, costPrice: 1700, stock: 12 },
  { name: "Chiffon Saree - Pastel", sku: "SAR-PST-03", category: "Sarees", size: "Free Size", price: 1899, costPrice: 1100, stock: 3 },
  { name: "Dress Material - Cotton Print", sku: "DRM-COT-11", category: "Dress Materials", size: "Free Size", price: 999, costPrice: 600, stock: 30 },
  { name: "Kurta - Beige Cotton", sku: "KUR-BEG-M", category: "Kurtas", size: "M", price: 899, costPrice: 520, stock: 26 },
  { name: "Kurta - Indigo Cotton", sku: "KUR-IND-L", category: "Kurtas", size: "L", price: 899, costPrice: 520, stock: 4 },
  { name: "Kids T-Shirt - Printed", sku: "TSH-KID-7", category: "T-Shirts", size: "7-8Y", price: 399, costPrice: 200, stock: 60 },
  { name: "Men's T-Shirt - Black", sku: "TSH-BLK-L", category: "T-Shirts", size: "L", price: 499, costPrice: 250, stock: 48 },
  { name: "Dupatta - Phulkari", sku: "DUP-PHK-01", category: "Dupattas", size: "Free Size", price: 599, costPrice: 320, stock: 2 },
  { name: "Salwar Suit - Anarkali", sku: "SAL-ANK-05", category: "Suits", size: "M", price: 1999, costPrice: 1200, stock: 18 },
];

const SUPPLIERS = [
  { name: "Shree Textiles Pvt Ltd", contactPerson: "Ramesh Kumar", phone: "9876501111", email: "sales@shreetextiles.in", address: "Surat, Gujarat", gstNumber: "24ABCDE1234F1Z5", notes: "Sarees and dress materials" },
  { name: "Delhi Fabric House", contactPerson: "Anita Sharma", phone: "9876502222", email: "contact@delhifabric.in", address: "Chandni Chowk, Delhi", gstNumber: "07PQRSX5678G1Z2", notes: "Shirts, kurtas, kids wear" },
  { name: "Kanchi Silk Mart", contactPerson: "Venkat Rao", phone: "9876503333", email: "orders@kanchisilk.in", address: "Kanchipuram, Tamil Nadu", gstNumber: "33IJKLM9012H1Z9", notes: "Premium silk sarees" },
];

async function seedDatabase({ force = false } = {}) {
  const existingUsers = await User.countDocuments();
  if (existingUsers > 0 && !force) {
    console.log(
      `Database already contains ${existingUsers} user(s) - skipping demo seed so real data is kept.`
    );
    console.log("Run `npm run seed -- --force` to wipe and re-create the demo data.");
    return { skipped: true };
  }

  console.log("Clearing existing data...");
  await Promise.all([
    User.deleteMany({}),
    Product.deleteMany({}),
    Supplier.deleteMany({}),
    Transaction.deleteMany({}),
    Return.deleteMany({}),
    LedgerEntry.deleteMany({}),
  ]);

  console.log("Creating users...");
  const password = await bcrypt.hash("admin123", 12);
  const staffPassword = await bcrypt.hash("staff123", 12);

  const admin = await User.create({
    name: "Priya Menon",
    email: "admin@posflow.com",
    password,
    phone: "9000000001",
    role: "admin",
  });

  const staff1 = await User.create({
    name: "Arun Kumar",
    email: "staff@posflow.com",
    password: staffPassword,
    phone: "9000000002",
    role: "staff",
  });

  const staff2 = await User.create({
    name: "Deepa Singh",
    email: "deepa@posflow.com",
    password: staffPassword,
    phone: "9000000003",
    role: "staff",
  });

  console.log("Creating suppliers...");
  const suppliers = await Supplier.create(SUPPLIERS);

  console.log("Creating products...");
  const products = await Product.create(
    PRODUCTS.map((p, i) => ({
      ...p,
      supplier: suppliers[i % suppliers.length]._id,
    }))
  );

  console.log("Creating sample transactions...");
  const methods = ["Cash", "UPI", "Card"];
  const staffPool = [staff1._id, staff2._id];
  const customers = [
    ["Walk-in Customer", ""],
    ["Sunita R.", "9812345670"],
    ["Vikram T.", "9812345671"],
    ["Meena P.", "9812345672"],
    ["", ""],
  ];

  const transactions = [];
  const ledgerEntries = [];
  let invoiceCounter = 0;

  for (let day = 13; day >= 0; day--) {
    const salesToday = 1 + Math.floor(Math.random() * 4);

    for (let s = 0; s < salesToday; s++) {
      const itemcount = 1 + Math.floor(Math.random() * 3);
      const usedIdx = new Set();
      const items = [];

      for (let i = 0; i < itemcount; i++) {
        const idx = Math.floor(Math.random() * products.length);
        if (usedIdx.has(idx)) continue;
        usedIdx.add(idx);

        const p = products[idx];
        const quantity = 1 + Math.floor(Math.random() * 2);
        items.push({
          productId: p._id,
          name: p.name,
          sku: p.sku,
          price: p.price,
          costPrice: p.costPrice,
          quantity,
          subtotal: p.price * quantity,
          returnedQuantity: 0,
        });
      }

      if (items.length === 0) continue;

      const subtotal = items.reduce((sum, it) => sum + it.subtotal, 0);
      const discount = s === 0 && day % 5 === 0 ? 100 : 0;
      const taxAmount = Math.round((subtotal - discount) * 0.05);
      const totalAmount = subtotal - discount + taxAmount;
      const paymentMethod = methods[Math.floor(Math.random() * methods.length)];

      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - day);
      createdAt.setHours(10 + Math.floor(Math.random() * 9), Math.floor(Math.random() * 60), 0, 0);

      const [customerName, customerPhone] =
        customers[Math.floor(Math.random() * customers.length)];

      invoiceCounter += 1;
      const transaction = {
        invoiceNumber: `INV-${createdAt.getTime()}-${invoiceCounter}`,
        items,
        customerName: customerName || "Walk-in Customer",
        customerPhone,
        subtotal,
        discount,
        taxAmount,
        totalAmount,
        paymentMethod,
        amountPaid: totalAmount,
        changeReturned: 0,
        staffId: staffPool[Math.floor(Math.random() * staffPool.length)],
        status: "Completed",
        refundAmount: 0,
        createdAt,
        updatedAt: createdAt,
      };

      transactions.push(transaction);
      ledgerEntries.push({
        type: "Sale",
        direction: "credit",
        amount: totalAmount,
        description: `Sale ${transaction.invoiceNumber}`,
        category: paymentMethod,
        createdBy: transaction.staffId,
        createdAt,
        updatedAt: createdAt,
      });
    }
  }

  const createdTransactions = await Transaction.create(transactions);

  console.log("Creating a sample return...");
  const target = createdTransactions[0];
  const returnLine = target.items[0];

  target.items[0].returnedQuantity = 1;
  target.refundAmount = returnLine.price;
  target.status = target.items.every((i) => i.returnedQuantity >= i.quantity)
    ? "Returned"
    : "Partially Returned";
  await target.save();

  const createdReturn = await Return.create({
    returnNumber: `RET-${Date.now()}-1`,
    transactionId: target._id,
    invoiceNumber: target.invoiceNumber,
    items: [
      {
        productId: returnLine.productId,
        name: returnLine.name,
        sku: returnLine.sku,
        price: returnLine.price,
        quantity: 1,
        subtotal: returnLine.price,
      },
    ],
    reason: "Size did not fit the customer",
    refundMethod: target.paymentMethod,
    refundAmount: returnLine.price,
    processedBy: admin._id,
  });

  await Product.findByIdAndUpdate(returnLine.productId, { $inc: { stock: 1 } });

  ledgerEntries.push({
    type: "Refund",
    direction: "debit",
    amount: returnLine.price,
    description: `Refund for ${target.invoiceNumber} (${createdReturn.returnNumber})`,
    category: "Return",
    returnId: createdReturn._id,
    createdBy: admin._id,
  });

  console.log("Creating expense + capital ledger entries...");
  const now = new Date();
  ledgerEntries.push(
    {
      type: "Capital",
      direction: "credit",
      amount: 200000,
      description: "Owner's opening capital",
      category: "Capital",
      createdBy: admin._id,
      createdAt: new Date(now.getTime() - 20 * 86400000),
    },
    {
      type: "Expense",
      direction: "debit",
      amount: 25000,
      description: "Shop rent - current month",
      category: "Rent",
      createdBy: admin._id,
      createdAt: new Date(now.getTime() - 12 * 86400000),
    },
    {
      type: "Expense",
      direction: "debit",
      amount: 18000,
      description: "Staff salaries - current month",
      category: "Salary",
      createdBy: admin._id,
      createdAt: new Date(now.getTime() - 10 * 86400000),
    },
    {
      type: "Expense",
      direction: "debit",
      amount: 4500,
      description: "Electricity bill",
      category: "Utilities",
      createdBy: admin._id,
      createdAt: new Date(now.getTime() - 5 * 86400000),
    }
  );

  await LedgerEntry.create(ledgerEntries);

  console.log("Demo data ready:");
  console.log("  Admin login : admin@posflow.com / admin123");
  console.log("  Staff login: staff@posflow.com  / staff123");
  console.log("  Staff login: deepa@posflow.com  / staff123");

  return { skipped: false };
}

module.exports = { seedDatabase };
