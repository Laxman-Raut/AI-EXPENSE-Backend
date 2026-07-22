// Backwards compatibility wrapper for email service
const emailModule = require("../email");

module.exports = {
  sendOtpEmail: emailModule.sendOtpEmail,
  sendSupportEmail: emailModule.sendSupportEmail,
  sendWelcomeEmail: emailModule.sendWelcomeEmail,
  sendSubscriptionEmail: emailModule.sendSubscriptionEmail,
};