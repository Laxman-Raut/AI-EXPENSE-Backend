const Razorpay = require("razorpay");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || process.env["Key ID (Test)"] || "dummy_key",
  key_secret: process.env.RAZORPAY_KEY_SECRET || process.env["Key Secret (Test)"] || "dummy_secret",
});

module.exports = razorpay;