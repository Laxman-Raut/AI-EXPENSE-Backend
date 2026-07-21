const User = require("../auth/model");
const Plan = require("../plan/model");
const SubscriptionHistory = require("../subscription-history/model");
const { createNotification } = require("../notification/service");
const Notification = require("../notification/model");

const checkAndExpireSubscriptions = async () => {
  try {
    const now = new Date();

    // 1. Process Expired Subscriptions
    // Find users whose subscription is active but end date is <= now
    const expiredUsers = await User.find({
      "subscription.status": "active",
      "subscription.endDate": { $lte: now, $ne: null },
    });

    if (expiredUsers.length > 0) {
      console.log(`[Subscription Scheduler] Found ${expiredUsers.length} subscriptions to expire.`);
    }

    for (const user of expiredUsers) {
      const planSlug = user.subscription.plan;
      const plan = await Plan.findOne({ slug: planSlug, isCurrent: true }) || await Plan.findOne({ slug: planSlug });

      user.subscription.status = "expired";
      user.subscription.autoRenew = false;
      await user.save();

      // Log in history
      await SubscriptionHistory.create({
        userId: user._id,
        planId: plan ? plan._id : null,
        action: "expired",
        provider: user.subscription.provider,
        startDate: user.subscription.startDate,
        endDate: user.subscription.endDate,
        amount: 0,
        currency: plan ? plan.currency : "INR",
        note: "Subscription expired automatically (time limit reached).",
      });

      // Create notification
      await createNotification({
        user: user._id,
        title: "Subscription Expired",
        body: "Your Pro subscription has expired. Renew now to continue enjoying premium features!",
        type: "system",
      });

      console.log(`[Subscription Scheduler] Expired subscription for user: ${user.fullName} (${user.email})`);
    }

    // 2. Process Subscriptions Expiring Soon
    // Expiring within next 3 days
    const soon = new Date();
    soon.setDate(soon.getDate() + 3);

    const expiringSoonUsers = await User.find({
      "subscription.status": "active",
      "subscription.endDate": { $gt: now, $lte: soon },
    });

    for (const user of expiringSoonUsers) {
      // Avoid sending duplicate notifications in the same subscription period
      const existingNotification = await Notification.findOne({
        user: user._id,
        title: "Subscription Expiring Soon",
        createdAt: { $gte: user.subscription.startDate || new Date(0) },
      });

      if (!existingNotification) {
        const dateString = user.subscription.endDate ? new Date(user.subscription.endDate).toLocaleDateString() : "";
        await createNotification({
          user: user._id,
          title: "Subscription Expiring Soon",
          body: `Your Pro subscription is expiring soon on ${dateString}. Renew now to keep your premium access active!`,
          type: "reminder",
        });

        console.log(`[Subscription Scheduler] Notified user of upcoming subscription expiry: ${user.fullName}`);
      }
    }
  } catch (error) {
    console.error("[Subscription Scheduler] Error in subscription scheduler run:", error);
  }
};

const startSubscriptionScheduler = () => {
  console.log("[Subscription Scheduler] Background auto-expire & warning scheduler started.");

  // Check immediately on startup
  checkAndExpireSubscriptions();

  // Run check every 60 seconds
  setInterval(checkAndExpireSubscriptions, 60000);
};

module.exports = {
  startSubscriptionScheduler,
  checkAndExpireSubscriptions,
};
