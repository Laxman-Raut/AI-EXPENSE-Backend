const notificationService = require("./service");

// Get all notifications
const getNotifications = async (req, res) => {
  try {
    const notifications =
      await notificationService.getUserNotifications(req.user.id);

    res.status(200).json({
      success: true,
      notifications,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Create notification
const createNotification = async (req, res) => {
  try {
    const { title, body, type, data } = req.body;

    const notification =
      await notificationService.createNotification({
        user: req.user.id,
        title,
        body,
        type,
        data,
      });

    res.status(201).json({
      success: true,
      notification,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Mark as read
const markAsRead = async (req, res) => {
  try {
    const notification =
      await notificationService.markAsRead(req.params.id);

    res.status(200).json({
      success: true,
      notification,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete one notification
const deleteNotification = async (req, res) => {
  try {
    await notificationService.deleteNotification(req.params.id);

    res.status(200).json({
      success: true,
      message: "Notification deleted successfully.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Clear all notifications
const clearNotifications = async (req, res) => {
  try {
    await notificationService.clearAllNotifications(req.user.id);

    res.status(200).json({
      success: true,
      message: "All notifications cleared.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getNotifications,
  createNotification,
  markAsRead,
  deleteNotification,
  clearNotifications,
};