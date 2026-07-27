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
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("AdminNotificationCampaign", adminNotificationCampaignSchema);
