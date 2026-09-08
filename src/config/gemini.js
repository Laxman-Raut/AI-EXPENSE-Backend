const { GoogleGenAI } = require("@google/genai");
const SystemSettings = require("../modules/admin/systemSettings.model");

let cachedSettings = null;
let lastSettingsFetch = 0;
const CACHE_TTL_MS = 60000; // 60s cache to avoid querying DB on every AI call

const getSystemSettingsDoc = async () => {
  const now = Date.now();
  if (cachedSettings && now - lastSettingsFetch < CACHE_TTL_MS) {
    return cachedSettings;
  }
  try {
    let settings = await SystemSettings.findOne();
    if (!settings) {
      settings = await SystemSettings.create({});
    }
    cachedSettings = settings;
    lastSettingsFetch = now;
    return settings;
  } catch (err) {
    console.error("[Gemini Config] Failed to fetch SystemSettings:", err.message);
    return cachedSettings || null;
  }
};

const getGeminiClient = async () => {
  const settings = await getSystemSettingsDoc();
  const apiKey = (settings && settings.geminiApiKey && settings.geminiApiKey.trim())
    ? settings.geminiApiKey.trim()
    : process.env.GEMINI_API_KEY;

  return new GoogleGenAI({ apiKey });
};

const getGeminiModel = async (fallbackModel = "gemini-3.1-flash-lite") => {
  const settings = await getSystemSettingsDoc();
  if (settings && settings.geminiModel) {
    if (
      settings.geminiModel === "gemini-2.5-flash" ||
      settings.geminiModel === "gemini-2.0-flash-lite"
    ) {
      settings.geminiModel = "gemini-3.1-flash-lite";
      cachedSettings = settings;
      settings.save().catch((e) => console.error("[Gemini Config] Auto-migrate error:", e.message));
      return "gemini-3.1-flash-lite";
    }
    return settings.geminiModel;
  }
  return fallbackModel;
};

// Fallback static instance for backwards compatibility
const defaultAi = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

module.exports = defaultAi;
module.exports.getGeminiClient = getGeminiClient;
module.exports.getGeminiModel = getGeminiModel;
module.exports.getSystemSettingsDoc = getSystemSettingsDoc;