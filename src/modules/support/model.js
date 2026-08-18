const mongoose = require("mongoose");

const supportQuerySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userName: {
      type: String,
      required: true,
      trim: true,
    },
    userEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    countryCode: {
      type: String,
      default: "+91",
      trim: true,
    },
    phoneNumber: {
      type: String,
      default: "",
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "in_progress", "resolved"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

supportQuerySchema.index({ createdAt: -1 });
supportQuerySchema.index({ status: 1 });

module.exports = mongoose.model("SupportQuery", supportQuerySchema);
