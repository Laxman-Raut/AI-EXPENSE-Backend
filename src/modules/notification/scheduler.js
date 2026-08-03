const User = require("../auth/model");
const Notification = require("./model");
const AdminNotificationCampaign = require("./adminNotificationCampaign.model");
const { createNotification } = require("./service");
const { sendBulkPushNotifications } = require("../../config/firebaseAdmin");

let lastProcessedDateString = "";

// Helper to build audience query based on segment
const buildSegmentQuery = (segment, specificEmail) => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  switch (segment) {
    case "free":
      return {
        $or: [
          { "subscription.plan": { $exists: false } },
          { "subscription.plan": "free" },
          { "subscription.status": { $ne: "active" } },
        ],
      };
    case "pro":
      return { "subscription.plan": "pro", "subscription.status": "active" };
    case "expired":
      return { "subscription.status": { $in: ["expired", "cancelled"] } };
    case "inactive":
      return {
        $or: [
          { lastVisitedAt: { $lt: thirtyDaysAgo } },
          { updatedAt: { $lt: thirtyDaysAgo } },
        ],
      };
    case "specific":
      return { email: (specificEmail || "").toLowerCase().trim() };
    case "all":
    default:
      return {};
  }
};

// Helper function to dispatch a campaign to target audience
const executeCampaignDispatch = async (campaign) => {
  try {
    const query = buildSegmentQuery(campaign.targetSegment, campaign.specificEmail);
    const targetUsers = await User.find(query, "_id email fullName fcmToken");

    if (targetUsers.length === 0) {
      console.log(`[Scheduled Campaign] No users found for campaign "${campaign.title}" (${campaign.targetSegment})`);
      return 0;
    }

    // Insert Notification records for all target users
    const notificationsToInsert = targetUsers.map((u) => ({
      user: u._id,
      title: campaign.title,
      body: campaign.body,
      type: campaign.type || "system",
      read: false,
      data: { segment: campaign.targetSegment, sentByAdmin: true, campaignId: campaign._id },
    }));

    await Notification.insertMany(notificationsToInsert);

    // Send FCM Push Notifications to target users with token
    const pushPayloads = targetUsers
      .filter((u) => u.fcmToken && u.fcmToken.trim() !== "")
      .map((u) => ({
        fcmToken: u.fcmToken,
        title: campaign.title,
        body: campaign.body,
        data: { type: campaign.type || "system", segment: campaign.targetSegment, sentByAdmin: "true" },
      }));

    if (pushPayloads.length > 0) {
      const pushResult = await sendBulkPushNotifications(pushPayloads);
      console.log(`[Scheduled Campaign] FCM push: ${pushResult.successCount} sent, ${pushResult.failureCount} failed.`);
    }

    return targetUsers.length;
  } catch (err) {
    console.error(`[Scheduled Campaign] Dispatch error for campaign ${campaign._id}:`, err.message);
    return 0;
  }
};

// Scheduled Runner for Daily & Specific Date Campaigns
const checkScheduledCampaigns = async () => {
  try {
    const now = new Date();
    const currentHour = String(now.getHours()).padStart(2, "0");
    const currentMin = String(now.getMinutes()).padStart(2, "0");
    const currentTime = `${currentHour}:${currentMin}`; // e.g. "14:00"
    const todayDateStr = now.toISOString().split("T")[0]; // YYYY-MM-DD

    // 1. Process Daily Recurring Campaigns
    const dueDailyCampaigns = await AdminNotificationCampaign.find({
      status: "active",
      scheduleType: "daily",
      scheduledTime: currentTime,
      lastRunDate: { $ne: todayDateStr },
    });

    for (const campaign of dueDailyCampaigns) {
      console.log(`[Scheduled Campaign] Executing daily recurring campaign "${campaign.title}" at ${currentTime}...`);
      const count = await executeCampaignDispatch(campaign);

      campaign.lastRunAt = now;
      campaign.lastRunDate = todayDateStr;
      campaign.recipientCount = count;
      await campaign.save();

      console.log(`[Scheduled Campaign] ✅ Daily campaign "${campaign.title}" completed. Sent to ${count} users.`);
    }

    // 2. Process Specific Date One-Time Campaigns
    const dueSpecificCampaigns = await AdminNotificationCampaign.find({
      status: "scheduled",
      scheduleType: "specific_date",
      scheduledDate: { $lte: now },
    });

    for (const campaign of dueSpecificCampaigns) {
      console.log(`[Scheduled Campaign] Executing specific date campaign "${campaign.title}"...`);
      const count = await executeCampaignDispatch(campaign);

      campaign.status = "completed";
      campaign.lastRunAt = now;
      campaign.lastRunDate = todayDateStr;
      campaign.recipientCount = count;
      await campaign.save();

      console.log(`[Scheduled Campaign] ✅ One-time scheduled campaign "${campaign.title}" completed. Sent to ${count} users.`);
    }
  } catch (err) {
    console.error("[Scheduled Campaign] Error checking scheduled campaigns:", err.message);
  }
};

const startReminderScheduler = () => {
  console.log("[Notification Scheduler] Daily inactivity & scheduled campaign runner started.");

  // Check every 30 seconds
  setInterval(async () => {
    // Check scheduled campaigns
    await checkScheduledCampaigns();

    // Inactivity check at 10 AM
    try {
      const now = new Date();
      const currentDateString = now.toDateString();

      if (now.getHours() >= 10 && lastProcessedDateString !== currentDateString) {
        lastProcessedDateString = currentDateString;
        console.log(`[Notification Scheduler] Running daily 10 AM inactivity check for ${currentDateString}...`);

        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        const idleUsers = await User.find({
          $or: [
            { lastVisitedAt: { $lt: todayStart } },
            { lastVisitedAt: { $exists: false } },
          ],
        });

        console.log(`[Notification Scheduler] Found ${idleUsers.length} idle users who haven't visited today.`);

        for (const user of idleUsers) {
          try {
            await createNotification({
              user: user._id,
              title: "Daily Inactivity Reminder",
              body: "You haven't visited the app today yet! Track your expenses to keep your budget in check.",
              type: "reminder",
            });
          } catch (err) {
            console.error(`[Notification Scheduler] Failed to send reminder to user ${user._id}:`, err);
          }
        }
      }
    } catch (err) {
      console.error("[Notification Scheduler] Error in inactivity reminder loop run:", err);
    }
  }, 30000); // 30 seconds interval
};

module.exports = {
  startReminderScheduler,
};
