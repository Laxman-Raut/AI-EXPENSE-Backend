const chatbotService = require("./service");
const { getSystemSettingsDoc } = require("../../config/gemini");
const { checkAndIncrementAiLimit } = require("../ai/aiLimitMiddleware");

// Send message to AI
const sendMessage = async (req, res) => {
  try {
    const settings = await getSystemSettingsDoc();
    if (settings && settings.aiFeatures && settings.aiFeatures.enableChatbot === false) {
      return res.status(503).json({
        success: false,
        message: "AI Chatbot is temporarily disabled for maintenance by the administrator."
      });
    }

    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Message is required.",
      });
    }

    // Enforce Plan Limits set by Admin
    await checkAndIncrementAiLimit(req.user.userId, 'chatbot');

    const reply = await chatbotService.sendMessage(
      req.user.userId,
      message
    );

    res.status(200).json({
      success: true,
      reply,
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

// Get chat history
const getHistory = async (req, res) => {
  try {
    const history = await chatbotService.getHistory(req.user.userId);

    res.status(200).json({
      success: true,
      history,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Clear history
const clearHistory = async (req, res) => {
  try {
    await chatbotService.clearHistory(req.user.userId);

    res.status(200).json({
      success: true,
      message: "Chat history cleared successfully.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  sendMessage,
  getHistory,
  clearHistory,
};