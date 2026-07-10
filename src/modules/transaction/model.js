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

    transactionDate: {
      type: Date,
      default: Date.now,
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

module.exports = mongoose.model("Transaction", transactionSchema);