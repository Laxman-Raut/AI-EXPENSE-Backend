const User = require("../auth/model");
const Payment = require("../payment/model");

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
      user.subscription = {
        plan: "free",
        status: "inactive",
        provider: "none",
        startDate: null,
        endDate: null,
        autoRenew: false,
      };
      await user.save();
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

  user.subscription = {
    plan: "pro",
    status: "active",
    provider: "manual",
    startDate: new Date(),
    endDate: null,
    autoRenew: false,
  };

  await user.save();

  return user.subscription;
};

const cancelSubscription = async (userId) => {
  const user = await User.findById(userId);

  if (!user) throw new Error("User not found");

  user.subscription = {
    plan: "free",
    status: "inactive",
    provider: "none",
    startDate: null,
    endDate: null,
    autoRenew: false,
  };

  await user.save();

  return user.subscription;
};

const getSubscriptionStatus = async (userId) => {
  const user = await User.findById(userId);

  if (!user) throw new Error("User not found");

  await syncUserSubscription(user);

  return (
    user.subscription.plan === "pro" &&
    user.subscription.status === "active"
  );
};

module.exports = {
  getSubscription,
  upgradeSubscription,
  cancelSubscription,
  getSubscriptionStatus,
};