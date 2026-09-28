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

// Re-entrancy guard to prevent overlapping execution runs
let isCheckingCampaigns = false;

// Scheduled Runner for Daily & Specific Date Campaigns
const checkScheduledCampaigns = async () => {
  if (isCheckingCampaigns) {
    return;
  }
  isCheckingCampaigns = true;

  try {
    const now = new Date();
    const currentHour = String(now.getHours()).padStart(2, "0");
    const currentMin = String(now.getMinutes()).padStart(2, "0");
    const currentTime = `${currentHour}:${currentMin}`; // e.g. "14:00"
    const todayDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    // 1. Process Daily Recurring Campaigns
    // Find all active daily campaigns due at this exact minute
    const dueDailyCampaigns = await AdminNotificationCampaign.find({
      status: "active",
      scheduleType: "daily",
      scheduledTime: currentTime,
      lastRunDate: { $ne: todayDateStr },
    });

    for (const campaign of dueDailyCampaigns) {
      // ATOMIC CLAIM: Update lastRunDate immediately BEFORE dispatching
      // This guarantees that any subsequent tick in the same minute will skip this campaign!
      const claimedCampaign = await AdminNotificationCampaign.findOneAndUpdate(
        {
          _id: campaign._id,
          lastRunDate: { $ne: todayDateStr },
        },
        {
          $set: {
            lastRunDate: todayDateStr,
            lastRunAt: now,
          },
        },
        { new: true }
      );

      if (!claimedCampaign) {
        // Already claimed by a concurrent worker
        continue;
      }

      console.log(`[Scheduled Campaign] Executing daily recurring campaign "${claimedCampaign.title}" at ${currentTime}...`);
      const count = await executeCampaignDispatch(claimedCampaign);

      claimedCampaign.recipientCount = count;
      await claimedCampaign.save();

      console.log(`[Scheduled Campaign] ✅ Daily campaign "${claimedCampaign.title}" completed. Sent to ${count} users.`);
    }

    // 2. Process Specific Date One-Time Campaigns
    const dueSpecificCampaigns = await AdminNotificationCampaign.find({
      status: "scheduled",
      scheduleType: "specific_date",
      scheduledDate: { $lte: now },
    });

    for (const campaign of dueSpecificCampaigns) {
      // ATOMIC CLAIM: Mark as completed immediately to prevent re-entrancy
      const claimedCampaign = await AdminNotificationCampaign.findOneAndUpdate(
        {
          _id: campaign._id,
          status: "scheduled",
        },
        {
          $set: {
            status: "completed",
            lastRunDate: todayDateStr,
            lastRunAt: now,
          },
        },
        { new: true }
      );

      if (!claimedCampaign) {
        continue;
      }

      console.log(`[Scheduled Campaign] Executing specific date campaign "${claimedCampaign.title}"...`);
      const count = await executeCampaignDispatch(claimedCampaign);

      claimedCampaign.recipientCount = count;
      await claimedCampaign.save();

      console.log(`[Scheduled Campaign] ✅ One-time scheduled campaign "${claimedCampaign.title}" completed. Sent to ${count} users.`);
    }
  } catch (err) {
    console.error("[Scheduled Campaign] Error checking scheduled campaigns:", err.message);
  } finally {
    isCheckingCampaigns = false;
  }
};

const startReminderScheduler = () => {
  console.log("[Notification Scheduler] Scheduled campaign runner started (Admin dashboard controlled).");

  // Check scheduled campaigns every 30 seconds
  setInterval(async () => {
    await checkScheduledCampaigns();
  }, 30000); // 30 seconds interval
};

module.exports = {
  startReminderScheduler,
};
