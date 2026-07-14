const express = require("express");

const router = express.Router();

const notificationController = require("./controller");

// Import your auth middleware
const authMiddleware = require("../auth/auth.middleware");

// Get all notifications
router.get(
  "/",
  authMiddleware,
  notificationController.getNotifications
);

// Create notification
router.post(
  "/",
  authMiddleware,
  notificationController.createNotification
);

// Mark notification as read
router.patch(
  "/:id/read",
  authMiddleware,
  notificationController.markAsRead
);

// Delete one notification
router.delete(
  "/:id",
  authMiddleware,
  notificationController.deleteNotification
);

// Clear all notifications
router.delete(
  "/",
  authMiddleware,
  notificationController.clearNotifications
);

module.exports = router;