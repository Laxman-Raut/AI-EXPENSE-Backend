const { parseVoiceTransaction } = require("./service");
const { getSystemSettingsDoc } = require("../../../config/gemini");

const voiceTransactionController = async (req, res) => {
  try {
    const settings = await getSystemSettingsDoc();
    if (settings && settings.aiFeatures && settings.aiFeatures.enableVoiceScanner === false) {
      return res.status(503).json({
        success: false,
        message: "Voice Transaction Scanner is temporarily disabled for maintenance by the administrator."
      });
    }

    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: "Voice text is required",
      });
    }

    const data = await parseVoiceTransaction(text);

    // Increment user's voice scanner usage count in DB
    if (req.user && req.user.userId) {
      const User = require("../../auth/model");
      await User.findByIdAndUpdate(req.user.userId, {
        $inc: { "aiUsage.voiceScanner.used": 1 }
      }).catch(err => console.error("Failed to increment voice scanner usage:", err));
    }

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  voiceTransactionController,
};