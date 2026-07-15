const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    mobile: {
      type: String,
      default: "",
    },

    age: {
      type: Number,
      default: null,
    },

    phone: {
      type: String,
      default: "",
      trim: true,
    },

    avatar: {
      url: {
        type: String,
        default: "",
      },
      publicId: {
        type: String,
        default: "",
      },
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    currency: {
      type: String,
      default: "INR",
    },

    monthlyBudget: {
      type: Number,
      default: 0,
    },

    categoryBudgets: {
      type: Map,
      of: Number,
      default: {},
    },

    lastVisitedAt: {
      type: Date,
      default: Date.now,
    },

    // Forgot Password
    resetOtp: {
      type: String,
      default: null,
    },

    resetOtpExpiry: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);