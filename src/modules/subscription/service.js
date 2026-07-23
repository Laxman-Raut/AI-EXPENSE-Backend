const User = require("../auth/model");
const Payment = require("../payment/model");
const Plan = require("../plan/model");
const SubscriptionHistory = require("../subscription-history/model");

/**
 * Validates and synchronizes the user's subscription state in the database.
 * If the subscription has expired or if the payment records were deleted/cleared,
 * it will automatically downgrade the user to the free tier.
 */
const syncUserSubscription = async (user) => {
  if (!user || !user.subscription) return;

  const now = new Date();

  // 1. Expiration Check: If the subscription has expired (current time > endDate)
  if (
    user.subscription.plan === "pro" &&
    user.subscription.status === "active" &&
    user.subscription.endDate &&
    now > new Date(user.subscription.endDate)
  ) {
    user.subscription.status = "expired";
    await user.save();

    // Log the expiration event on-demand
    const plan = await Plan.findOne({ slug: "pro", isCurrent: true }) || await Plan.findOne({ slug: "pro" });
    await SubscriptionHistory.create({
      userId: user._id,
      planId: plan ? plan._id : null,
      action: "expired",
      provider: user.subscription.provider,
      startDate: user.subscription.startDate,
      endDate: user.subscription.endDate,
      amount: 0,
      currency: plan ? plan.currency : "INR",
      note: "Subscription expired automatically (on-demand sync).",
    });
    return;
  }

  // 2. Payment Integrity Check: For razorpay/google_play providers,
  // verify a corresponding successful payment record actually exists.
  // If payment records were deleted from the DB, downgrade the user.
  if (
    user.subscription.plan === "pro" &&
    ["razorpay", "google_play"].includes(user.subscription.provider)
  ) {
    const hasSuccessfulPayment = await Payment.exists({
      userId: user._id,
      status: "success",
    });

    if (!hasSuccessfulPayment) {
      const plan = await Plan.findOne({ slug: "pro", isCurrent: true }) || await Plan.findOne({ slug: "pro" });

      user.subscription = {
        plan: "free",
        status: "inactive",
        provider: "none",
        startDate: null,
        endDate: null,
        autoRenew: false,
      };
      await user.save();

      // Log the downgrade event
      await SubscriptionHistory.create({
        userId: user._id,
        planId: plan ? plan._id : null,
        action: "cancelled",
        provider: "none",
        startDate: null,
        endDate: null,
        amount: 0,
        currency: "INR",
        note: "Subscription cancelled automatically due to missing payment record (integrity check).",
      });
    }
  }
};

const getSubscription = async (userId) => {
  const user = await User.findById(userId);

  if (!user) throw new Error("User not found");

  await syncUserSubscription(user);

  return user.subscription;
};

const upgradeSubscription = async (userId) => {
  const user = await User.findById(userId);

  if (!user) throw new Error("User not found");

  const plan = await Plan.findOne({ slug: "pro", isCurrent: true }) || await Plan.findOne({ slug: "pro" });

  user.subscription = {
    plan: "pro",
    status: "active",
    provider: "manual",
    startDate: new Date(),
    endDate: null,
    autoRenew: false,
  };

  await user.save();

  await SubscriptionHistory.create({
    userId: user._id,
    planId: plan ? plan._id : null,
    action: "upgraded",
    provider: "manual",
    startDate: user.subscription.startDate,
    endDate: user.subscription.endDate,
    amount: plan ? plan.price : 0,
    currency: plan ? plan.currency : "INR",
    note: "Upgraded by user.",
  });

  return user.subscription;
};

const cancelSubscription = async (userId) => {
  const user = await User.findById(userId);

  if (!user) throw new Error("User not found");

  const plan = await Plan.findOne({ slug: user.subscription.plan, isCurrent: true }) || await Plan.findOne({ slug: user.subscription.plan });

  user.subscription = {
    plan: "free",
    status: "cancelled",
    provider: "none",
    startDate: null,
    endDate: null,
    autoRenew: false,
  };

  await user.save();

  await SubscriptionHistory.create({
    userId: user._id,
    planId: plan ? plan._id : null,
    action: "cancelled",
    provider: user.subscription.provider,
    startDate: null,
    endDate: null,
    amount: 0,
    currency: "INR",
    note: "Cancelled by user.",
  });

  return user.subscription;
};

const getSubscriptionStatus = async (userId) => {
  const user = await User.findById(userId);

  if (!user) throw new Error("User not found");

  await syncUserSubscription(user);

  return (
    user.subscription.plan !== "free" &&
    user.subscription.status === "active"
  );
};

const getSubscriptionTimeline = async (userId) => {
  return await SubscriptionHistory.find({ userId })
    .populate("planId", "name version price")
    .sort({ createdAt: -1 });
};

module.exports = {
  getSubscription,
  upgradeSubscription,
  cancelSubscription,
  getSubscriptionStatus,
  getSubscriptionTimeline,
};