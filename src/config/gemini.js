const { GoogleGenAI } = require("@google/genai");
const SystemSettings = require("../modules/admin/systemSettings.model");

const getSystemSettingsDoc = async () => {
  try {
    let settings = await SystemSettings.findOne();
    if (!settings) {
      settings = await SystemSettings.create({});
    }
    return settings;
  } catch (err) {
    console.error("[Gemini Config] Failed to fetch SystemSettings:", err.message);
    return null;
  }
};

const getGeminiClient = async () => {
  const settings = await getSystemSettingsDoc();
  const apiKey = (settings && settings.geminiApiKey && settings.geminiApiKey.trim())
    ? settings.geminiApiKey.trim()
    : process.env.GEMINI_API_KEY;

  return new GoogleGenAI({ apiKey });
};

const getGeminiModel = async (fallbackModel = "gemini-2.5-flash") => {
  const settings = await getSystemSettingsDoc();
  return (settings && settings.geminiModel) ? settings.geminiModel : fallbackModel;
};

// Fallback static instance for backwards compatibility
const defaultAi = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

module.exports = defaultAi;
module.exports.getGeminiClient = getGeminiClient;
module.exports.getGeminiModel = getGeminiModel;
module.exports.getSystemSettingsDoc = getSystemSettingsDoc;