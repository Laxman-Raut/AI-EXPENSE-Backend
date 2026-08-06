const cron = require("node-cron");
const { fetchLatestRates } = require("./service");

// Run every day at 12:00 AM
cron.schedule("0 0 * * *", async () => {
  console.log("⏰ Running Daily Currency Update...");

  const result = await fetchLatestRates();

  if (result.success) {
    console.log("✅ Currency rates updated.");
  } else {
    console.log(" Currency update failed.");
  }
});

// Run once when server starts
(async () => {
  console.log(" Fetching currency rates on server startup...");
  await fetchLatestRates();
})();