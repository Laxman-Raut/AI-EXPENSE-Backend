const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    adminName: {
      type: String,
      default: "Administrator",
    },
    adminEmail: {
      type: String,
      default: "",
    },
    action: {
      type: String,
      required: true, // e.g., 'ADMIN_LOGIN', 'PASSWORD_CHANGE', 'PROFILE_UPDATE', 'SESSIONS_REVOKE_ALL', 'PLAN_CREATE', 'COUPON_CREATE'
      index: true,
    },
    category: {
      type: String,
      enum: ["auth", "security", "plan", "coupon", "user", "settings", "system"],
      default: "security",
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    ipAddress: {
      type: String,
      default: "",
    },
    userAgent: {
      type: String,
      default: "",
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    status: {
      type: String,
      enum: ["success", "failed", "warning"],
      default: "success",
    },
  },
  {
    timestamps: true,
  }
);

auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model("AuditLog", auditLogSchema);
