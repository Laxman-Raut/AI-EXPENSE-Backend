const Notification = require("./model");

// Create Notification
const createNotification = async ({
  user,
  title,
  body,
  type = "system",
  data = {},
}) => {
  return await Notification.create({
    user,
    title,
    body,
    type,
    data,
  });
};

// Get All Notifications of User
const getUserNotifications = async (userId) => {
  return await Notification.find({
    user: userId,
  }).sort({ createdAt: -1 });
};

// Mark Notification as Read
const markAsRead = async (notificationId) => {
  return await Notification.findByIdAndUpdate(
    notificationId,
    {
      read: true,
    },
    {
      new: true,
    }
  );
};

// Delete One Notification
const deleteNotification = async (notificationId) => {
  return await Notification.findByIdAndDelete(notificationId);
};

// Clear All Notifications of User
const clearAllNotifications = async (userId) => {
  return await Notification.deleteMany({
    user: userId,
  });
};

module.exports = {
  createNotification,
  getUserNotifications,
  markAsRead,
  deleteNotification,
  clearAllNotifications,
};