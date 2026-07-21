const { getSubscriptionStatus } = require("../subscription/service");

const requirePro = async (req, res, next) => {
  try {
    const isProActive = await getSubscriptionStatus(req.user.userId);

    if (!isProActive) {
      return res.status(403).json({
        success: false,
        message: "Upgrade to Pro to access this feature.",
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = requirePro;