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
      min: 1,
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

    frequency: {
      type: String,
      enum: ["daily", "weekly", "monthly", "yearly"],
      required: true,
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
      enum: ["active", "paused"],
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
