const mongoose = require("mongoose");

const recurringTransactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    type: {
      type: String,
      enum: ["expense", "income"],
      required: true,
    },

    category: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    currency: {
      type: String,
      default: "INR",
    },

    originalAmount: { type: Number, default: null },
    originalCurrency: { type: String, default: "INR" },
    amountINR: { type: Number, default: null },
    amountUSD: { type: Number, default: null },
    exchangeRate: { type: Number, default: null },
    exchangeRateTimestamp: { type: Date, default: null },


    paymentMethod: {
      type: String,
      enum: [
        "Cash",
        "UPI",
        "Credit Card",
        "Debit Card",
        "Wallet",
        "Bank Transfer",
      ],
      default: "UPI",
    },

    frequency: {
      type: String,
      enum: ["daily", "weekly", "monthly", "yearly", "emi"],
      required: true,
    },

    totalInstallments: {
      type: Number,
      default: null,
      min: 1,
    },

    paidInstallments: {
      type: Number,
      default: 0,
      min: 0,
    },

    startDate: {
      type: Date,
      required: true,
    },

    nextExecutionDate: {
      type: Date,
      required: true,
    },

    lastExecutedAt: {
      type: Date,
      default: null,
    },

    status: {
      type: String,
      enum: ["active", "paused", "completed"],
      default: "active",
    },

    note: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("RecurringTransaction", recurringTransactionSchema);
