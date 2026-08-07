const User = require("../auth/model");
const Plan = require("../plan/model");
const razorpay = require("../payment/razorpay");

const enableAutoPay = async (userId) => {
  // Find User
  const user = await User.findById(userId);

  if (!user) {
    throw new Error("User not found");
  }

  // Find Current Pro Plan
  const plan = await Plan.findOne({
    slug: "pro",
    isCurrent: true,
  });

  if (!plan) {
    throw new Error("Pro plan not found");
  }

  // Check Razorpay Plan ID
  if (!plan.razorpayPlanId) {
    throw new Error("Razorpay Plan ID not configured");
  }

  // Create Razorpay Subscription
  const subscription = await razorpay.subscriptions.create({
    plan_id: plan.razorpayPlanId,
    customer_notify: 1,
    total_count: 120, // 120 months
  });

  // Save in DB
  user.subscription.razorpaySubscriptionId = subscription.id;
  user.subscription.mandateStatus = "pending";

  await user.save();

  return {
    subscriptionId: subscription.id,
    status: subscription.status,
    shortUrl: subscription.short_url,
  };
};

module.exports = {
  enableAutoPay,
};