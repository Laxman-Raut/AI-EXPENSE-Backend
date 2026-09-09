const AuditLog = require("./auditLog.model");

/**
 * Record an administrative audit log event.
 * Designed to be non-blocking and safe so it will never crash or interrupt business operations.
 */
const recordAuditLog = async ({
  req = null,
  adminId = null,
  adminName = "",
  adminEmail = "",
  action,
  category = "security",
  description,
  metadata = {},
  status = "success",
}) => {
  try {
    if (!action || !description) return null;

    let resolvedAdminId = adminId;
    let resolvedName = adminName;
    let resolvedEmail = adminEmail;
    let ipAddress = "";
    let userAgent = "";

    if (req) {
      if (!resolvedAdminId && req.user) {
        resolvedAdminId = req.user.userId || req.user.id || req.user._id;
      }
      if (!resolvedName && req.user?.fullName) {
        resolvedName = req.user.fullName;
      }
      if (!resolvedEmail && req.user?.email) {
        resolvedEmail = req.user.email;
      }

      ipAddress =
        req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
        req.socket?.remoteAddress ||
        req.ip ||
        "";
      userAgent = req.headers["user-agent"] || "";
    }

    if (!resolvedAdminId) {
      // If still no adminId, check metadata or skip
      resolvedAdminId = metadata?.adminId;
    }

    if (!resolvedAdminId) {
      return null;
    }

    const logEntry = await AuditLog.create({
      adminId: resolvedAdminId,
      adminName: resolvedName || "Administrator",
      adminEmail: resolvedEmail || "",
      action,
      category,
      description,
      ipAddress,
      userAgent,
      metadata,
      status,
    });

    return logEntry;
  } catch (error) {
    console.warn("[AuditLog] Failed to record event:", error.message);
    return null;
  }
};

/**
 * Retrieve recent administrative audit logs.
 */
const getAuditLogs = async ({ limit = 30, category = null, adminId = null } = {}) => {
  const query = {};
  if (category) {
    query.category = category;
  }
  if (adminId) {
    query.adminId = adminId;
  }

  const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 30, 1), 100);

  const logs = await AuditLog.find(query)
    .sort({ createdAt: -1 })
    .limit(parsedLimit)
    .lean();

  return logs;
};

module.exports = {
  recordAuditLog,
  getAuditLogs,
};
