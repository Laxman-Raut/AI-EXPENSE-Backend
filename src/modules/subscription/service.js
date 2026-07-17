const User = require("../auth/model");

const getSubscription = async (userId) => {
  const user = await User.findById(userId);

  if (!user) throw new Error("User not found");

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