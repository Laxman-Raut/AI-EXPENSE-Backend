const chatbotService = require("./service");

// Send message to AI
const sendMessage = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Message is required.",
      });
    }

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