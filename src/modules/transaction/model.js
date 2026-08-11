const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
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

    originalAmount: {
      type: Number,
      default: null,
    },

    originalCurrency: {
      type: String,
      default: "INR",
    },

    amountINR: {
      type: Number,
      default: null,
    },

    amountUSD: {
      type: Number,
      default: null,
    },

    exchangeRate: {
      type: Number,
      default: null,
    },

    exchangeRateTimestamp: {
      type: Date,
      default: null,
    },


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

    transactionDate: {
      type: Date,
      default: Date.now,
    },

    bankAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bank",
      default: null,
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

transactionSchema.index({ user: 1, transactionDate: -1 });
transactionSchema.index({ user: 1, type: 1, transactionDate: -1 });
transactionSchema.index({ user: 1, bankAccount: 1, transactionDate: -1 });

module.exports = mongoose.model("Transaction", transactionSchema);
