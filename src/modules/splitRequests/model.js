const mongoose = require("mongoose");

const splitRequestSchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 1,
    },

    originalCurrency: { type: String, default: "INR" },
    totalAmountINR: { type: Number, default: null },
    totalAmountUSD: { type: Number, default: null },
    exchangeRate: { type: Number, default: null },
    exchangeRateTimestamp: { type: Date, default: null },

    paidBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    splitType: {
      type: String,
      enum: ["equal", "exact", "percentage", "shares"],
      default: "equal",
    },

    currency: {
      type: String,
      default: "INR",
    },

    dueDate: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default 7 days from creation
    },

    overdueProcessed: {
      type: Boolean,
      default: false,
    },

    participants: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },

        amount: {
          type: Number,
          default: 0,
        },

        amountINR: { type: Number, default: null },
        amountUSD: { type: Number, default: null },


        percentage: {
          type: Number,
          default: 0,
        },

        shares: {
          type: Number,
          default: 0,
        },

        status: {
          type: String,
          enum: ["pending", "accepted", "rejected", "paid"],
          default: "pending",
        },
      },
    ],

    status: {
      type: String,
      enum: ["pending", "completed", "cancelled"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("SplitRequest", splitRequestSchema);