const express = require("express");
const {
  getDailyTxns,
  getMonthSummary,
  getStats,
  getTimeline,
  getDaySummary,
  getHeatmap,
} = require("./controller");
const {
  validateDateParam,
  validateMonthYearParams,
  validateTimelineQuery,
} = require("./validation");
const authenticate = require("../auth/auth.middleware");

const router = express.Router();

// Apply auth middleware globally to all calendar routes
router.use(authenticate);

// Feature 1: Daily Transactions
router.get("/date/:date", validateDateParam, getDailyTxns);

// Feature 2: Monthly Calendar Summary
router.get("/month/:year/:month", validateMonthYearParams, getMonthSummary);

// Feature 3: Calendar Statistics
router.get("/stats/:year/:month", validateMonthYearParams, getStats);

// Feature 4: Calendar Timeline
router.get("/timeline", validateTimelineQuery, getTimeline);

// Feature 5: Daily Summary
router.get("/summary/:date", validateDateParam, getDaySummary);

// Feature 6: Calendar Heat Map
router.get("/heatmap/:year/:month", validateMonthYearParams, getHeatmap);

module.exports = router;