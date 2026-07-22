require("dotenv").config();
const { sendOtpEmail, sendWelcomeEmail } = require("./src/modules/email");

(async () => {
  try {
    console.log("Testing email service from src/modules/email...");
    console.log("Email module loaded successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Email module test error:", err);
    process.exit(1);
  }
})();