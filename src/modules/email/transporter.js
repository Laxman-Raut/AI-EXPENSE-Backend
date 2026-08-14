const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,          // 587 (STARTTLS) — more reliable on cloud/Render than 465
  secure: false,      // false = STARTTLS (upgrades after connect)
  family: 4,          // Force IPv4 — Render free tier blocks IPv6
  connectionTimeout: 10000,  // fail in 10s if can't connect
  greetingTimeout: 10000,    // fail in 10s if no greeting from server
  socketTimeout: 15000,      // fail in 15s if socket goes silent
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

module.exports = transporter;

