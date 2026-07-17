const {
  getSubscription,
  upgradeSubscription,
  cancelSubscription,
  getSubscriptionStatus,
} = require("./service");

const getCurrentSubscription = async (req, res) => {
  try {
    const data = await getSubscription(req.user.userId);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const upgrade = async (req, res) => {
  try {
    const data = await upgradeSubscription(req.user.userId);

    res.json({
      success: true,
      message: "Subscription upgraded successfully.",
      data,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const cancel = async (req, res) => {
  try {
    const data = await cancelSubscription(req.user.userId);

    res.json({
      success: true,
      message: "Subscription cancelled.",
      data,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const status = async (req, res) => {
  try {
    const isPro = await getSubscriptionStatus(req.user.userId);

    res.json({
      success: true,
      isPro,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getCurrentSubscription,
  upgrade,
  cancel,
  status,
};