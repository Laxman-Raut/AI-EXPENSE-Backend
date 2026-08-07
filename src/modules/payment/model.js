const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    currency: {
      type: String,
      default: "INR",
    },

    plan: {
      type: String,
      required: true,
    },

    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plan",
      default: null,
    },

    basePrice: {
      type: Number,
      default: null,
    },

    baseCurrency: {
      type: String,
      default: "INR",
    },

    displayPrice: {
      type: Number,
      default: null,
    },

    displayCurrency: {
      type: String,
      default: "INR",
    },

    exchangeRate: {
      type: Number,
      default: 1,
    },

    razorpayAmountPaise: {
      type: Number,
      default: 0,
    },

    originalAmount: {
      type: Number,
      default: null,
    },

    discountAmount: {
      type: Number,
      default: 0,
    },

    couponCode: {
      type: String,
      default: null,
    },

    provider: {
      type: String,
      enum: ["razorpay", "google_play", "manual"],
      default: "razorpay",
    },

    status: {
      type: String,
      enum: ["pending", "success", "failed", "refunded"],
      default: "pending",
    },

    razorpayOrderId: {
      type: String,
      default: "",
    },

    razorpayPaymentId: {
      type: String,
      default: "",
    },

    razorpaySignature: {
      type: String,
      default: "",
    },

    paidAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Payment = mongoose.model("Payment", paymentSchema);

module.exports= Payment;