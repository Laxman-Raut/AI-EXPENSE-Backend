const getPendingBudgetThresholds = (percentage, sentThresholds = new Set()) => {
  const pending = [];

  if (percentage >= 50 && percentage < 80 && !sentThresholds.has("50")) {
    pending.push(50);
  }
  if (percentage >= 80 && percentage < 100 && !sentThresholds.has("80")) {
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

module.exports = { getPendingBudgetThresholds };
