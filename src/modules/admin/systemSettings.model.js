const mongoose = require("mongoose");

const systemSettingsSchema = new mongoose.Schema(
  {
    geminiModel: {
      type: String,
      enum: [
        "gemini-2.5-flash",
        "gemini-3.1-flash-lite",
        "gemini-1.5-pro",
        "gemini-2.0-flash",
        "gemini-flash-latest"
      ],
      default: "gemini-2.5-flash",
    },
    geminiApiKey: {
      type: String,
      default: "",
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
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("SystemSettings", systemSettingsSchema);
