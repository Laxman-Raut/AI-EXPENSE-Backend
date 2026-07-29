const User = require("../auth/model");
const Plan = require("../plan/model");

/**
 * Checks and increments AI feature usage limit for a user based on their active plan limits set by Admin.
 * @param {string} userId - User ID
 * @param {'chatbot' | 'receiptScanner' | 'voiceScanner'} featureType - AI Feature name
 */
const checkAndIncrementAiLimit = async (userId, featureType) => {
  if (!userId) return true;

  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found.");
  }

  // Admin or Super Admin role bypasses limits
  if (user.role === "admin" || user.role === "super_admin") {
    return true;
  }

  // 1. Resolve user active plan slug
  const planSlug = (user.subscription && user.subscription.plan) ? user.subscription.plan : "free";

  // 2. Fetch plan document from DB
  const plan = await Plan.findOne({ slug: planSlug, isCurrent: true }) || await Plan.findOne({ slug: planSlug });

  const limitFieldMap = {
    chatbot: "chatbotLimit",
    receiptScanner: "receiptScannerLimit",
    voiceScanner: "voiceScannerLimit",
  };

  const featureNameMap = {
    chatbot: "Chatbot queries",
    receiptScanner: "Receipt Scans",
    voiceScanner: "Voice Scans",
  };

  const limitKey = limitFieldMap[featureType];
  const featureTitle = featureNameMap[featureType] || "AI Feature";

  // Allowed limit set by Super Admin on this plan
  const allowedLimit = plan?.limits?.[limitKey] ?? 0;

  // 3. Reset daily usage counter if date has changed
  const todayStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const userAiUsage = user.aiUsage || {};
  const featureUsage = userAiUsage[featureType] || { used: 0, limit: 0, lastResetDate: "" };

  if (featureUsage.lastResetDate !== todayStr) {
    featureUsage.used = 0;
    featureUsage.lastResetDate = todayStr;
  }

  // 4. Check if limit is reached (if allowedLimit > 0, enforce limit)
  if (allowedLimit > 0 && featureUsage.used >= allowedLimit) {
    const error = new Error(`Daily limit reached for ${featureTitle} on your current plan (${allowedLimit}/${allowedLimit} used). Please upgrade your plan to unlock more AI queries!`);
    error.statusCode = 403;
    error.code = "LIMIT_REACHED";
    error.allowedLimit = allowedLimit;
    error.used = featureUsage.used;
    throw error;
  }

  // 5. Increment usage counter
  featureUsage.used += 1;
  featureUsage.limit = allowedLimit;

  if (!user.aiUsage) user.aiUsage = {};
  user.aiUsage[featureType] = featureUsage;
  user.markModified("aiUsage");
  await user.save();

  return true;
};

module.exports = {
  checkAndIncrementAiLimit,
};
