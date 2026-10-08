const test = require("node:test");
const assert = require("node:assert/strict");
const {
  getPendingBudgetThresholds,
  getSentThresholdsForBudget,
} = require("./budgetThresholds");

test("emits the 50% milestone only below 80%", () => {
  assert.deepEqual(getPendingBudgetThresholds(50), [50]);
  assert.deepEqual(getPendingBudgetThresholds(79.99), [50]);
});

test("emits the 80% milestone only from 80% to below 100%", () => {
  assert.deepEqual(getPendingBudgetThresholds(80), [80]);
  assert.deepEqual(getPendingBudgetThresholds(99.99), [80]);
  assert.deepEqual(getPendingBudgetThresholds(100), [100]);
});

test("emits reached and exceeded milestones above 100%, never an 80% alert", () => {
  assert.deepEqual(getPendingBudgetThresholds(100.01), [100, "exceeded"]);
  assert.deepEqual(getPendingBudgetThresholds(125), [100, "exceeded"]);
});

test("rechecks all crossed milestones when the budget itself is updated", () => {
  assert.deepEqual(
    getPendingBudgetThresholds(125, new Set(), { budgetUpdated: true }),
    [80, 100, "exceeded"],
  );
});

test("does not resend thresholds already recorded this month", () => {
  assert.deepEqual(
    getPendingBudgetThresholds(125, new Set(["50", "80", "100", "exceeded"])),
    [],
  );
  assert.deepEqual(
    getPendingBudgetThresholds(125, new Set(["80"])),
    [100, "exceeded"],
  );
});

test("thresholds from a previous budget do not suppress the updated budget", () => {
  const oldBudgetAlerts = [
    { data: { threshold: 80, budgetKey: "1000.00" } },
    { data: { threshold: 100, budgetKey: "1000.00" } },
  ];

  const sentForUpdatedBudget = getSentThresholdsForBudget(
    oldBudgetAlerts,
    "750.00",
    750,
    "monthlyBudget",
  );

  assert.deepEqual(getPendingBudgetThresholds(90, sentForUpdatedBudget), [80]);
});
