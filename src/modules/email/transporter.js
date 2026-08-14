const nodemailer = require("nodemailer");
const axios = require("axios");

// Fallback Nodemailer Transporter (for local development or if no HTTP API key is set)
const smtpTransporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  family: 4,
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 15000,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendMailViaHttp = async (mailOptions) => {
  const apiKey = (process.env.BREVO_API_KEY || process.env.RESEND_API_KEY || process.env.EMAIL_API_KEY || "").trim();
  const senderEmail = (process.env.EMAIL_USER || "lraut248@gmail.com").trim();

  if (!apiKey) {
    throw new Error("No EMAIL_API_KEY, BREVO_API_KEY, or RESEND_API_KEY configured.");
  }

  const isBrevo = process.env.BREVO_API_KEY || apiKey.startsWith("xkeysib-");

  if (isBrevo) {
    const payload = {
      sender: { name: "Expenso", email: senderEmail },
      to: [{ email: mailOptions.to }],
      subject: mailOptions.subject,
      htmlContent: mailOptions.html,
    };
    const response = await axios.post("https://api.brevo.com/v3/smtp/email", payload, {
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
      },
      timeout: 12000,
    });
    return {
      messageId: response.data.messageId || response.data.id || "brevo-success",
      response: "200 OK (Brevo API)",
    };
  } else {
    // Resend API
    const fromAddr = senderEmail.includes("@resend.dev")
      ? senderEmail
      : `Expenso <onboarding@resend.dev>`;
    const payload = {
      from: fromAddr,
      to: [mailOptions.to],
      subject: mailOptions.subject,
      html: mailOptions.html,
    };
    const response = await axios.post("https://api.resend.com/emails", payload, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      timeout: 12000,
    });
    return {
      messageId: response.data.id || "resend-success",
      response: "200 OK (Resend API)",
    };
  }
};

const transporter = {
  sendMail: async (mailOptions) => {
    const apiKey = (process.env.BREVO_API_KEY || process.env.RESEND_API_KEY || process.env.EMAIL_API_KEY || "").trim();
    if (apiKey) {
      console.log(`[Email Transporter] Dispatching via HTTPS API to ${mailOptions.to}...`);
      return await sendMailViaHttp(mailOptions);
    }
    console.log(`[Email Transporter] Dispatching via SMTP to ${mailOptions.to}...`);
    return await smtpTransporter.sendMail(mailOptions);
  },
  verify: async () => {
    const apiKey = (process.env.BREVO_API_KEY || process.env.RESEND_API_KEY || process.env.EMAIL_API_KEY || "").trim();
    if (apiKey) {
      return true;
    }
    return await smtpTransporter.verify();
  },
};

module.exports = transporter;

