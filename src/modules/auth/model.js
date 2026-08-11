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
    upiId: {
  type: String,
  trim: true,
  default: "",
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

    accountStatus: {
      type: String,
      enum: ["active", "suspended"],
      default: "active",
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


    // Finance


    currency: {
      type: String,
      default: "INR",
    },

    monthlyBudget: {
      type: Number,
      default: 0,
    },

    monthlyBudgetINR: {
      type: Number,
      default: 0,
    },

    monthlyBudgetUSD: {
      type: Number,
      default: 0,
    },

    monthlyBudgetCurrency: {
      type: String,
      default: "INR",
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

      note: {
        type: String,
        default: "",
      },
    },

    autoRenew: {
  type: Boolean,
  default: false,
},

// Razorpay Subscription ID
razorpaySubscriptionId: {
  type: String,
  default: "",
},

// AutoPay Mandate Status
mandateStatus: {
  type: String,
  enum: [
    "inactive",
    "pending",
    "active",
    "cancelled",
    "failed",
  ],
  default: "inactive",
},

// Next automatic billing date
nextBillingDate: {
  type: Date,
  default: null,
},

note: {
  type: String,
  default: "",
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
        lastResetDate: {
          type: String,
          default: "",
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
        lastResetDate: {
          type: String,
          default: "",
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
        lastResetDate: {
          type: String,
          default: "",
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

    // Registration Email Verification OTP
    verificationOtp: {
      type: String,
      default: null,
    },

    verificationOtpExpiry: {
      type: Date,
      default: null,
    },

    // FCM Push Notification Token
    fcmToken: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

module.exports= User;