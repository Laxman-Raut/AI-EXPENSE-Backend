const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");

const authRoutes = require("./src/modules/auth/routes");
const transactionRoutes = require("./src/modules/transaction/routes");
const dashboardRoutes = require("./src/modules/dashboard/routes");
const calendarRoutes = require("./src/modules/calendar/routes");
const analyticsRoutes = require("./src/modules/analytics/routes");
const uploadRoutes = require("./src/modules/upload/routes");
const aiRoutes = require("./src/modules/ai/routes");
const voiceRoutes = require("./src/modules/ai/voice/routes");
const exportRoutes = require("./src/modules/export/routes");
const notificationRoutes = require("./src/modules/notification/routes");
const chatbotRoutes = require("./src/modules/chatbot/routes");
const recurringRoutes = require("./src/modules/recurringTransaction/routes");
const subscriptionRoutes = require("./src/modules/subscription/routes");
const paymentRoutes = require("./src/modules/payment/routes");
const planRoutes = require("./src/modules/plan/routes");
const adminRoutes = require("./src/modules/admin/routes");
const friendRoutes = require("./src/modules/friends/routes");
const groupRoutes = require("./src/modules/groups/routes");
const splitRequestRoutes = require("./src/modules/splitRequests/routes");
const upiRoutes = require("./src/modules/upi/routes");
const bankRoutes = require("./src/modules/bank/routes");
const savingsRoutes = require("./src/modules/savings/routes");
const currencyRoutes = require("./src/modules/currency/routes");
const compression = require("compression");

const app = express();

// Enable GZIP HTTP response compression
app.use(compression());

// Health Check Endpoint (Server Warm-up Ping)
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// Email Diagnostic Endpoint — hit this on your deployed server to test email
app.get("/api/health/email", async (req, res) => {
  const transporter = require("./src/modules/email/transporter");
  const emailUser = process.env.EMAIL_USER;
  const apiKey = process.env.BREVO_API_KEY || process.env.RESEND_API_KEY || process.env.EMAIL_API_KEY;

  try {
    const info = await transporter.sendMail({
      from: emailUser || "lraut248@gmail.com",
      to: emailUser || "lraut248@gmail.com",
      subject: "Expenso - Email Diagnostic Test",
      html: `<h2>✅ Email is working!</h2><p>Sent from your Render server at ${new Date().toISOString()}</p>`,
    });
    return res.status(200).json({
      status: "ok",
      message: "Test email dispatched successfully.",
      provider: apiKey ? "HTTPS API (Port 443)" : "SMTP",
      messageId: info.messageId,
      response: info.response,
      EMAIL_USER: emailUser || "lraut248@gmail.com",
    });
  } catch (err) {
    return res.status(500).json({
      status: "error",
      message: err.message,
      provider: apiKey ? "HTTPS API (Port 443)" : "SMTP",
      EMAIL_USER: emailUser || "lraut248@gmail.com",
      API_KEY: apiKey ? "configured" : "MISSING (using SMTP fallback)",
    });
  }
});

// Middleware
// CORS Configuration — supports both Mobile (no credentials) and Dashboard (with credentials/cookies)
const allowedOrigins = [
  process.env.DASHBOARD_URL || "http://localhost:3000",
  "http://localhost:3000",
  "http://localhost:3001",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, Postman, server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      // For non-listed origins, still allow but without credentials
      return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Client-Type"],
  })
);

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/calendar", calendarRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/voice", voiceRoutes);
app.use("/api/export", exportRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/chatbot", chatbotRoutes);
app.use("/api/recurring-transactions", recurringRoutes);
app.use("/api/subscription", subscriptionRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/v1/plans", planRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/friends", friendRoutes);
app.use("/api/users", friendRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/split-requests", splitRequestRoutes);
app.use("/api/upi", upiRoutes);
app.use("/api/banks", bankRoutes);
app.use("/api/bank", bankRoutes);
app.use("/api/savings", savingsRoutes);
app.use("/api/currency", currencyRoutes);
app.use("/api/v1/currency", currencyRoutes);

// Health Check
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Expenso API Running",
  });
});

module.exports = app;
