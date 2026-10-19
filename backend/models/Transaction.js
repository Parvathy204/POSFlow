const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
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
        // Purchase cost at the time of sale - snapshot for profit reports.
        costPrice: {
          type: Number,
          default: 0,
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
        // How many units of this line have been returned so far.
        returnedQuantity: {
          type: Number,
          default: 0,
          min: 0,
        },
      },
    ],

    customerName: {
      type: String,
      trim: true,
      default: "Walk-in Customer",
    },
    customerPhone: {
      type: String,
      trim: true,
      default: "",
    },

    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    discount: {
      type: Number,
      min: 0,
      default: 0,
    },
    taxAmount: {
      type: Number,
      min: 0,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    paymentMethod: {
      type: String,
      enum: ["Cash", "UPI", "Card"],
      required: true,
    },
    amountPaid: {
      type: Number,
      min: 0,
      default: 0,
    },
    changeReturned: {
      type: Number,
      min: 0,
      default: 0,
    },

    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    status: {
      type: String,
      enum: ["Completed", "Partially Returned", "Returned", "Cancelled"],
      default: "Completed",
    },
    refundAmount: {
      type: Number,
      min: 0,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Transaction", transactionSchema);
