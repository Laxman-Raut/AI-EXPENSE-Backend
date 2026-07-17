const User = require("./model");

const requirePro = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (
      user.subscription.plan !== "pro" ||
      user.subscription.status !== "active"
    ) {
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