const express = require("express");
const authenticate = require("../auth/auth.middleware");
const { 
    dashboardSummary,
    recentTransactions,
} = require("./controller");

const router = express.Router();

// Dashboard Summary
router.get("/", authenticate, dashboardSummary);
router.get("/recent", authenticate, recentTransactions);

module.exports = router;