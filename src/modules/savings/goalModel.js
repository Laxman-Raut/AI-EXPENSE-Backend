const mongoose = require("mongoose");

const savingsGoalSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    targetAmount: {
      type: Number,
      required: [true, "Target savings amount is required"],
      min: [1, "Target amount must be greater than 0"],
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
    targetAmountINR: {
      type: Number,
      default: null,
    },
    targetAmountUSD: {
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
    period: {
      type: String,
      enum: ["weekly", "monthly", "yearly"],
      default: "monthly",
      required: true,
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

const SavingsGoal = mongoose.model("SavingsGoal", savingsGoalSchema);

module.exports = SavingsGoal;
