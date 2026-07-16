require("dotenv").config();

const app = require("./app");
const connectDB = require("./src/config/db");
const { startReminderScheduler } = require("./src/modules/notification/scheduler");
const { startRecurringScheduler } = require("./src/modules/recurringTransaction/scheduler");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, "0.0.0.0", () => {
      console.log(` Server running on http://0.0.0.0:${PORT}`);
    });

    // Start background inactivity reminders check
    startReminderScheduler();

    // Start background recurring transactions scheduler
    startRecurringScheduler();
  } catch (error) {
    console.error(error);
  }
};

startServer();