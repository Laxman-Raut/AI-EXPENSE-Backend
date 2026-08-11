const mongoose = require("mongoose");

const savingsTransactionSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: [true, "Transaction amount is required"],
    min: [0.01, "Transaction amount must be greater than 0"],
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
  type: {
    type: String,
    enum: ["deposit", "withdraw", "transfer_in", "transfer_out"],
    required: true,
  },
  fromJar: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SavingsJar",
    default: null,
  },
  toJar: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SavingsJar",
    default: null,
  },
  notes: {
    type: String,
    trim: true,
    default: "",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

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
      required: [true, "Savings Jar name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    icon: {
      type: String,
      default: "🏆",
      trim: true,
    },
    color: {
      type: String,
      default: "#4C6EF5",
      trim: true,
    },
    targetAmount: {
      type: Number,
      default: null,
      min: [0, "Target amount cannot be negative"],
    },
    targetAmountINR: { type: Number, default: null },
    targetAmountUSD: { type: Number, default: null },
    currentAmount: {
      type: Number,
      default: 0,
      min: [0, "Current amount cannot be negative"],
    },
    currentAmountINR: { type: Number, default: 0 },
    currentAmountUSD: { type: Number, default: 0 },
    originalCurrency: { type: String, default: "INR" },
    exchangeRate: { type: Number, default: null },
    exchangeRateTimestamp: { type: Date, default: null },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["active", "completed", "archived"],
      default: "active",
      index: true,
    },
    transactions: [savingsTransactionSchema],
  },

  {
    timestamps: true,
  }
);

// Helper method to check if target is met and auto-update status
savingsJarSchema.methods.updateStatusBasedOnTarget = function () {
  if (this.targetAmount && this.targetAmount > 0) {
    if (this.currentAmount >= this.targetAmount && this.status === "active") {
      this.status = "completed";
    } else if (this.currentAmount < this.targetAmount && this.status === "completed") {
      this.status = "active";
    }
  }
};

savingsJarSchema.index({ user: 1, status: 1, updatedAt: -1 });

const SavingsJar = mongoose.model("SavingsJar", savingsJarSchema);

module.exports = SavingsJar;
