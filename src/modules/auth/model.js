const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {

    // Personal Information


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
      trim: true,
    },

    age: {
      type: Number,
      default: null,
    },

    role: {
      type: String,
      enum: ["user", "admin", "super_admin"],
      default: "user",
    },

    isVerified: {
      type: Boolean,
      default: false,
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


    // Finance


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


    // Subscription


    subscription: {
      plan: {
        type: String,
        enum: ["free", "pro"],
        default: "free",
      },

      status: {
        type: String,
        enum: ["active", "inactive", "expired", "cancelled"],
        default: "inactive",
      },

      provider: {
        type: String,
        enum: ["none", "google_play", "razorpay", "manual"],
        default: "none",
      },

      startDate: {
        type: Date,
        default: null,
      },

      endDate: {
        type: Date,
        default: null,
      },

      autoRenew: {
        type: Boolean,
        default: false,
      },
    },


    // AI Usage

    aiUsage: {
      chatbot: {
        used: {
          type: Number,
          default: 0,
        },

        limit: {
          type: Number,
          default: 0,
        },
      },

      receiptScanner: {
        used: {
          type: Number,
          default: 0,
        },

        limit: {
          type: Number,
          default: 0,
        },
      },

      voiceScanner: {
        used: {
          type: Number,
          default: 0,
        },

        limit: {
          type: Number,
          default: 0,
        },
      },
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

const User = mongoose.model("User", userSchema);

module.exports= User;