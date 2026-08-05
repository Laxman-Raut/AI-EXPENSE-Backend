const mongoose = require("mongoose");

const savingsTransactionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["deposit", "withdraw", "transfer_in", "transfer_out"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    notes: {
      type: String,
      default: "",
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const savingsJarSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Savings jar name is required"],
      trim: true,
    },
    targetAmount: {
      type: Number,
      required: [true, "Target amount is required"],
      min: [1, "Target amount must be at least 1"],
    },
    currentAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    icon: {
      type: String,
      default: "trophy-outline",
    },
    color: {
      type: String,
      default: "#8A3FFC",
    },
    status: {
      type: String,
      enum: ["active", "completed", "archived"],
      default: "active",
    },
    targetDate: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      default: "",
    },
    history: [savingsTransactionSchema],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("SavingsJar", savingsJarSchema);
