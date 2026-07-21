const mongoose = require("mongoose");

const subscriptionHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plan",
      required: true,
    },

    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      default: null,
    },

    action: {
      type: String,
      enum: [
        "activated",
        "renewed",
        "extended",
        "cancelled",
        "expired",
        "upgraded",
        "downgraded",
      ],
      required: true,
    },

    provider: {
      type: String,
      enum: [
        "razorpay",
        "google_play",
        "manual",
        "system",
      ],
      default: "system",
    },

    startDate: {
      type: Date,
      default: null,
    },

    endDate: {
      type: Date,
      default: null,
    },

    amount: {
      type: Number,
      default: 0,
    },

    currency: {
      type: String,
      default: "INR",
    },

    note: {
      type: String,
      default: "",
      trim: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const SubscriptionHistory = mongoose.model(
  "SubscriptionHistory",
  subscriptionHistorySchema
);

module.exports = SubscriptionHistory;