const express = require("express");
const authenticate = require("../auth/auth.middleware");
const {
  monthlyAnalytics,
  categoryAnalytics,
  budgetUtilization,
  yearlyComparison,
} = require("./controller");

const router = express.Router();

// Analytics endpoints
router.get("/monthly", authenticate, monthlyAnalytics);
router.get("/category", authenticate, categoryAnalytics);
router.get("/budget", authenticate, budgetUtilization);
router.get("/yearly", authenticate, yearlyComparison);

module.exports = router;
