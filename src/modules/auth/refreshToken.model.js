const mongoose = require("mongoose");

const refreshTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // MongoDB TTL index — auto-deletes expired docs
    },
    userAgent: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("RefreshToken", refreshTokenSchema);
