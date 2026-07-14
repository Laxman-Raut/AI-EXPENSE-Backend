const express = require("express");
const cors = require("cors");
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

const app = express();

// Middleware
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

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

// Health Check
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "AI Expense Tracker API Running",
  });
});

module.exports = app;