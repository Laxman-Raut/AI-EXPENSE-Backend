const mongoose = require("mongoose");

const systemSettingsSchema = new mongoose.Schema(
  {
    geminiModel: {
      type: String,
      enum: [
        "gemini-3.6-flash",
        "gemini-3.5-flash-lite",
        "gemini-3.1-flash-lite",
        "gemini-2.5-flash",
        "gemini-1.5-pro",
        "gemini-2.0-flash",
        "gemini-flash-latest"
      ],
      default: "gemini-3.1-flash-lite",
    },
    geminiApiKey: {
      type: String,
      default: "",
    },
    currency: {
      type: String,
      enum: ["INR", "USD"],
      default: "INR",
    },
    aiFeatures: {
      enableReceiptScanner: {
        type: Boolean,
        default: true,
      },
      enableVoiceScanner: {
        type: Boolean,
        default: true,
      },
      enableChatbot: {
        type: Boolean,
        default: true,
      },
    },
    maintenanceMode: {
      type: Boolean,
      default: false,
    },
    autoBackup: {
      type: Boolean,
      default: false,
    },
    emailNotifications: {
      type: Boolean,
      default: true,
    },
    smsNotifications: {
      type: Boolean,
      default: false,
    },
    paymentGateway: {
      provider: {
        type: String,
        enum: ["razorpay", "stripe"],
        default: "razorpay",
      },
      environment: {
        type: String,
        enum: ["test", "live"],
        default: "test",
      },
      razorpay: {
        enabled: {
          type: Boolean,
          default: true,
        },
        keyId: {
          type: String,
          default: "",
        },
        keySecret: {
          type: String,
          default: "",
        },
        webhookSecret: {
          type: String,
          default: "",
        },
      },
      stripe: {
        enabled: {
          type: Boolean,
          default: false,
        },
        publishableKey: {
          type: String,
          default: "",
        },
        secretKey: {
          type: String,
          default: "",
        },
        webhookSecret: {
          type: String,
          default: "",
        },
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("SystemSettings", systemSettingsSchema);
