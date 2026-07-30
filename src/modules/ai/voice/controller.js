const { parseVoiceTransaction } = require("./service");
const { getSystemSettingsDoc } = require("../../../config/gemini");
const { checkAndIncrementAiLimit } = require("../aiLimitMiddleware");

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

    // Enforce Plan Limits set by Admin
    if (req.user && req.user.userId) {
      await checkAndIncrementAiLimit(req.user.userId, 'voiceScanner');
    }

    const data = await parseVoiceTransaction(text);

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(error);

    if (error.code === 'LIMIT_REACHED' || error.statusCode === 403) {
      return res.status(403).json({
        success: false,
        code: 'LIMIT_REACHED',
        message: error.message,
        allowedLimit: error.allowedLimit,
        used: error.used,
      });
    }

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  voiceTransactionController,
};