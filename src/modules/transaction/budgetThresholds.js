const getPendingBudgetThresholds = (
  percentage,
  sentThresholds = new Set(),
  { budgetUpdated = false } = {},
) => {
  const pending = [];

  if (percentage >= 50 && percentage < 80 && !sentThresholds.has("50")) {
    pending.push(50);
  }
  if (
    percentage >= 80 &&
    percentage < 100 &&
    !sentThresholds.has("80")
  ) {
    pending.push(80);
  }
  if (percentage >= 100 && !sentThresholds.has("100")) {
    pending.push(100);
  }
  if (percentage > 100 && !sentThresholds.has("exceeded")) {
    pending.push("exceeded");
  }

  return pending;
};

const matchesBudgetSnapshot = (notificationData, budgetKey, budgetAmount, legacyField) => {
  if (notificationData?.budgetKey !== undefined) {
    return String(notificationData.budgetKey) === budgetKey;
  }

  const legacyBudget = Number(notificationData?.[legacyField]);
  return Number.isFinite(legacyBudget) && Math.round(legacyBudget) === Math.round(budgetAmount);
};

const getSentThresholdsForBudget = (notifications, budgetKey, budgetAmount, legacyField) =>
  new Set(
    notifications
      .filter((notification) => matchesBudgetSnapshot(
        notification.data,
        budgetKey,
        budgetAmount,
        legacyField,
      ))
      .map((notification) => String(notification.data?.threshold)),
  );

module.exports = { getPendingBudgetThresholds, getSentThresholdsForBudget };
