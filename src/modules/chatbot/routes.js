const express = require("express");

const router = express.Router();

const chatbotController = require("./controller");

// Import your auth middleware
const authenticate = require("../auth/auth.middleware");

// Send message
router.post(
  "/",
  authenticate,
  chatbotController.sendMessage
);

// Get chat history
router.get(
  "/history",
  authenticate,
  chatbotController.getHistory
);

// Clear history
router.delete(
  "/history",
  authenticate,
  chatbotController.clearHistory
);

module.exports = router;