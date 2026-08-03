const mongoose = require("mongoose");

const adminNotificationCampaignSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    body: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["system", "budget", "ai", "reminder", "security", "expense", "income"],
      default: "system",
    },
    targetSegment: {
      type: String,
      enum: ["all", "free", "pro", "expired", "inactive", "specific"],
      default: "all",
    },
    specificEmail: {
      type: String,
      default: "",
    },
    recipientCount: {
      type: Number,
      default: 0,
    },
    sentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    // Scheduling Fields
    scheduleType: {
      type: String,
      enum: ["immediate", "daily", "specific_date"],
      default: "immediate",
    },
    scheduledTime: {
      type: String, // "HH:MM" e.g. "14:00" for 2:00 PM
      default: "",
    },
    scheduledDate: {
      type: Date, // For specific_date scheduling
      default: null,
    },
    status: {
      type: String,
      enum: ["sent", "scheduled", "active", "paused", "completed", "cancelled"],
      default: "sent",
    },
    lastRunAt: {
      type: Date,
      default: null,
    },
    lastRunDate: {
      type: String, // "YYYY-MM-DD"
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("AdminNotificationCampaign", adminNotificationCampaignSchema);
