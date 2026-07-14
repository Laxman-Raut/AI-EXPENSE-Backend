const express = require("express");

const router = express.Router();

const chatbotController = require("./controller");

// Import your auth middleware
const auth = require("../../middleware/auth"); // Change this path if your middleware is elsewhere

// Send message
router.post(
  "/",
  auth,
  chatbotController.sendMessage
);

// Get chat history
router.get(
  "/history",
  auth,
  chatbotController.getHistory
);

// Clear history
router.delete(
  "/history",
  auth,
  chatbotController.clearHistory
);

module.exports = router;