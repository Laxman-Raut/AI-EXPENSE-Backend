const Razorpay = require("razorpay");
const SystemSettings = require("../admin/systemSettings.model");

/**
 * Returns dynamic Razorpay credentials from DB settings (fallback to .env)
 */
const getRazorpayCredentials = async () => {
  try {
    const settings = await SystemSettings.findOne().lean();
    const dbRzp = settings?.paymentGateway?.razorpay;
    const envKeyId = process.env.RAZORPAY_KEY_ID || process.env["Key ID (Test)"] || "";
    const envKeySecret = process.env.RAZORPAY_KEY_SECRET || process.env["Key Secret (Test)"] || "";

    const key_id = (dbRzp?.keyId && dbRzp.keyId.trim()) || envKeyId || "dummy_key";
    const key_secret = (dbRzp?.keySecret && dbRzp.keySecret.trim()) || envKeySecret || "dummy_secret";
    const webhookSecret = (dbRzp?.webhookSecret && dbRzp.webhookSecret.trim()) || "";

    return { key_id, key_secret, webhookSecret };
  } catch (err) {
    console.error("[Razorpay] Failed to load DB settings, using env:", err.message);
    return {
      key_id: process.env.RAZORPAY_KEY_ID || process.env["Key ID (Test)"] || "dummy_key",
      key_secret: process.env.RAZORPAY_KEY_SECRET || process.env["Key Secret (Test)"] || "dummy_secret",
      webhookSecret: "",
    };
  }
};

/**
 * Returns an initialized Razorpay instance with the latest DB credentials
 */
const getRazorpayInstance = async () => {
  const creds = await getRazorpayCredentials();
  return new Razorpay({
    key_id: creds.key_id,
    key_secret: creds.key_secret,
  });
};

const defaultInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || process.env["Key ID (Test)"] || "dummy_key",
  key_secret: process.env.RAZORPAY_KEY_SECRET || process.env["Key Secret (Test)"] || "dummy_secret",
});

module.exports = defaultInstance;
module.exports.getRazorpayCredentials = getRazorpayCredentials;
module.exports.getRazorpayInstance = getRazorpayInstance;