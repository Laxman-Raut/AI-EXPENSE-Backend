require("dotenv").config();

const app = require("./app");
const connectDB = require("./src/config/db");
const { startReminderScheduler } = require("./src/modules/notification/scheduler");
const { startRecurringScheduler } = require("./src/modules/recurringTransaction/scheduler");
const { startSubscriptionScheduler } = require("./src/modules/subscription/scheduler");
const { startSplitOverdueScheduler } = require("./src/modules/splitRequests/splitOverdueScheduler");
require("./src/modules/currency/scheduler");
const PORT = process.env.PORT || 5000;

// Keep Render free tier alive — ping self every 14 minutes to prevent sleep
const keepAlive = () => {
  const serverUrl = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
  setInterval(async () => {
    try {
      const https = serverUrl.startsWith("https") ? require("https") : require("http");
      https.get(`${serverUrl}/api/health`, (res) => {
        console.log(`[Keep-Alive] Self-ping OK — status: ${res.statusCode}`);
      }).on("error", (err) => {
        console.warn(`[Keep-Alive] Self-ping failed: ${err.message}`);
      });
    } catch (e) {
      console.warn("[Keep-Alive] Ping error:", e.message);
    }
  }, 14 * 60 * 1000); // every 14 minutes
};

const startServer = async () => {
  try {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(` Server running on http://0.0.0.0:${PORT}`);
    });

    // Connect to DB (non-blocking so server stays active even if DB delays)
    await connectDB();

    // Start background inactivity reminders check
    startReminderScheduler();

    // Start background recurring transactions scheduler
    startRecurringScheduler();

    // Start subscription auto-expiry and expiring-soon warning scheduler
    startSubscriptionScheduler();

    // Start split expense overdue auto-settlement scheduler
    startSplitOverdueScheduler();

    // Keep server alive on Render free tier (ping every 14 min)
    keepAlive();
  } catch (error) {
    console.error("Server initialization error:", error);
  }
};

startServer();