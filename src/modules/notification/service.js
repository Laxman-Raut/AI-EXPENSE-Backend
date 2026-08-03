const Notification = require("./model");
const User = require("../auth/model");
const { sendPushNotification } = require("../../config/firebaseAdmin");

// Create Notification + Send FCM Push
const createNotification = async ({
  user,
  title,
  body,
  type = "system",
  data = {},
}) => {
  // 1. Save to database (in-app notification)
  const notification = await Notification.create({
    user,
    title,
    body,
    type,
    data,
  });

  // 2. Send FCM push notification (lockscreen/homescreen)
  try {
    const userDoc = await User.findById(user).select("fcmToken").lean();
    if (userDoc && userDoc.fcmToken) {
      await sendPushNotification(userDoc.fcmToken, title, body, {
        type,
        notificationId: notification._id.toString(),
        ...data,
      });
    }
  } catch (pushErr) {
    // Don't let push failure affect the notification creation
    console.error("[Notification Service] FCM push error (non-fatal):", pushErr.message);
  }

  return notification;
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