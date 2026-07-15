const User = require("../auth/model");
const { createNotification } = require("./service");

let lastProcessedDateString = "";

const startReminderScheduler = () => {
  console.log("[Notification Scheduler] Daily inactivity reminder scheduler started.");
  
  setInterval(async () => {
    try {
      const now = new Date();
      const currentDateString = now.toDateString(); // e.g. "Wed Jul 15 2026"
      
      // If it is at or after 10:00 AM, and we haven't processed this date yet:
      if (now.getHours() >= 10 && lastProcessedDateString !== currentDateString) {
        lastProcessedDateString = currentDateString;
        console.log(`[Notification Scheduler] Running daily 10 AM inactivity check for ${currentDateString}...`);
        
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        // Find users who haven't visited today (their lastVisitedAt is older than today at 12:00 AM)
        const idleUsers = await User.find({
          $or: [
            { lastVisitedAt: { $lt: todayStart } },
            { lastVisitedAt: { $exists: false } }
          ]
        });

        console.log(`[Notification Scheduler] Found ${idleUsers.length} idle users who haven't visited today.`);

        for (const user of idleUsers) {
          try {
            await createNotification({
              user: user._id,
              title: "Daily Inactivity Reminder",
              body: "You haven't visited the app today yet! Track your expenses to keep your budget in check.",
              type: "reminder",
            });
            console.log(`[Notification Scheduler] Successfully created reminder for user: ${user.fullName}`);
          } catch (err) {
            console.error(`[Notification Scheduler] Failed to send reminder to user ${user._id}:`, err);
          }
        }
      }
    } catch (err) {
      console.error("[Notification Scheduler] Error in scheduler loop run:", err);
    }
  }, 10000); // Check every 10 seconds
};

module.exports = {
  startReminderScheduler,
};
