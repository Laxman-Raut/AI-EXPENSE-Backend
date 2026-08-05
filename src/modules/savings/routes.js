const express = require("express");
const router = express.Router();
const controller = require("./controller");
const authMiddleware = require("../auth/auth.middleware");

// Get all savings jars & summary
router.get("/", authMiddleware, controller.getJarsCtrl);

// AI Suggestions (must come before /:id)
router.get("/suggestions", authMiddleware, controller.getAISuggestionsCtrl);

// Create savings jar
router.post("/", authMiddleware, controller.createJarCtrl);

// Transfer money between jars
router.post("/transfer", authMiddleware, controller.transferCtrl);

// Single jar details
router.get("/:id", authMiddleware, controller.getJarByIdCtrl);

// Update jar
router.patch("/:id", authMiddleware, controller.updateJarCtrl);

// Delete jar
router.delete("/:id", authMiddleware, controller.deleteJarCtrl);

// Deposit funds
router.post("/:id/deposit", authMiddleware, controller.depositCtrl);

// Withdraw funds
router.post("/:id/withdraw", authMiddleware, controller.withdrawCtrl);

module.exports = router;
