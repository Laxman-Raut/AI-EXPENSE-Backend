const mongoose = require("mongoose");
const dns = require("dns");

// Fix Node.js DNS SRV lookup issues on Windows / Node 18+
try {
  dns.setDefaultResultOrder("ipv4first");
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (dnsErr) {
  console.warn("DNS configuration warning:", dnsErr.message);
}

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(" MongoDB Connected Successfully");
  } catch (error) {
    console.error(" MongoDB Connection Error:", error.message);
  }
};

module.exports = connectDB;