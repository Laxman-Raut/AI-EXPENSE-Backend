/**
 * Firebase Admin SDK Configuration
 * ----------------------------------
 * Initializes firebase-admin for server-side push notifications via FCM.
 * 
 * Setup: Place your Firebase Service Account JSON file at:
 *   src/config/firebase-service-account.json
 * 
 * Download from: Firebase Console → Project Settings → Service Accounts → Generate new private key
 */

const { initializeApp, cert } = require("firebase-admin/app");
const { getMessaging } = require("firebase-admin/messaging");
const path = require("path");

let isInitialized = false;

const initializeFirebaseAdmin = () => {
  if (isInitialized) return true;

  try {
    let serviceAccount = null;

    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        serviceAccount = typeof process.env.FIREBASE_SERVICE_ACCOUNT === "string"
          ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
          : process.env.FIREBASE_SERVICE_ACCOUNT;
      } catch (e) {
        console.warn("[Firebase Admin] ⚠️ FIREBASE_SERVICE_ACCOUNT env var is invalid JSON:", e.message);
      }
    }

    if (!serviceAccount) {
      const fs = require("fs");
      const serviceAccountPath = path.join(__dirname, "firebase-service-account.json");
      if (fs.existsSync(serviceAccountPath)) {
        serviceAccount = require(serviceAccountPath);
      }
    }

    if (serviceAccount) {
      initializeApp({
        credential: cert(serviceAccount),
      });
      isInitialized = true;
      console.log("[Firebase Admin] ✅ Initialized successfully.");
      return true;
    } else {
      console.log(
        "[Firebase Admin] ℹ️ Push notifications disabled (firebase-service-account.json not found). Set FIREBASE_SERVICE_ACCOUNT env var on Render if needed."
      );
      isInitialized = false;
      return false;
    }
  } catch (err) {
    console.warn("[Firebase Admin] ⚠️ Could not initialize:", err.message);
    isInitialized = false;
    return false;
  }
};

// Initialize on require
initializeFirebaseAdmin();

/**
 * Send a push notification to a single device via FCM.
 * @param {string} fcmToken - The device's FCM registration token
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Optional custom data payload
 * @returns {Promise<string|null>} - Message ID on success, null on failure
 */
const sendPushNotification = async (fcmToken, title, body, data = {}) => {
  if (!isInitialized) {
    return null;
  }

  if (!fcmToken || fcmToken.trim() === "") {
    return null;
  }

  try {
    const message = {
      notification: {
        title,
        body,
      },
      data: {
        ...Object.fromEntries(
          Object.entries(data).map(([k, v]) => [k, String(v)])
        ),
        title,
        body,
      },
      token: fcmToken,
      android: {
        priority: "high",
        notification: {
          channelId: "expense-tracker",
          priority: "high",
          defaultSound: true,
          defaultVibrateTimings: true,
        },
      },
    };

    const messageId = await getMessaging().send(message);
    console.log(`[Firebase Admin] ✅ Push sent to token: ${fcmToken.substring(0, 20)}... | ID: ${messageId}`);
    return messageId;
  } catch (err) {
    // Handle expired/invalid tokens gracefully
    if (
      err.code === "messaging/invalid-registration-token" ||
      err.code === "messaging/registration-token-not-registered"
    ) {
      console.warn(`[Firebase Admin] ⚠️ Invalid/expired FCM token: ${fcmToken.substring(0, 20)}...`);
    } else {
      console.error("[Firebase Admin] ❌ Push send error:", err.message);
    }
    return null;
  }
};

/**
 * Send push notifications to multiple devices via FCM.
 * @param {Array<{fcmToken: string, title: string, body: string, data?: object}>} notifications
 * @returns {Promise<{successCount: number, failureCount: number}>}
 */
const sendBulkPushNotifications = async (notifications) => {
  if (!isInitialized) {
    return { successCount: 0, failureCount: 0 };
  }

  const validNotifications = notifications.filter(
    (n) => n.fcmToken && n.fcmToken.trim() !== ""
  );

  if (validNotifications.length === 0) {
    return { successCount: 0, failureCount: 0 };
  }

  const messages = validNotifications.map((n) => ({
    notification: {
      title: n.title,
      body: n.body,
    },
    data: {
      ...Object.fromEntries(
        Object.entries(n.data || {}).map(([k, v]) => [k, String(v)])
      ),
      title: n.title,
      body: n.body,
    },
    token: n.fcmToken,
    android: {
      priority: "high",
      notification: {
        channelId: "expense-tracker",
        priority: "high",
        defaultSound: true,
        defaultVibrateTimings: true,
      },
    },
  }));

  try {
    const response = await getMessaging().sendEach(messages);
    console.log(
      `[Firebase Admin] ✅ Bulk push: ${response.successCount} sent, ${response.failureCount} failed.`
    );
    return {
      successCount: response.successCount,
      failureCount: response.failureCount,
    };
  } catch (err) {
    console.error("[Firebase Admin] ❌ Bulk push error:", err.message);
    return { successCount: 0, failureCount: validNotifications.length };
  }
};

module.exports = {
  sendPushNotification,
  sendBulkPushNotifications,
};
