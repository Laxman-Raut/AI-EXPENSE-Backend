const {
  getReportSummary,
  getRevenueReport,
  getUserReport,
  getSubscriptionReport,
  getPaymentReport,
  getAnalyticsData,
} = require("./reports.repository");

// GET /api/v1/admin/reports/summary
const getReportsSummary = async (req, res) => {
  try {
    const data = await getReportSummary(req.query);
    return res.status(200).json({ success: true, message: "Report summary fetched.", data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/admin/reports/revenue?year=2026&month=9&startDate=...&endDate=...
const getRevenueReportCtrl = async (req, res) => {
  try {
    const data = await getRevenueReport(req.query);
    return res.status(200).json({ success: true, message: "Revenue report fetched.", data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/admin/reports/users?year=2026&month=9&startDate=...&endDate=...
const getUserReportCtrl = async (req, res) => {
  try {
    const data = await getUserReport(req.query);
    return res.status(200).json({ success: true, message: "User report fetched.", data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/admin/reports/subscriptions?year=2026&month=9
const getSubscriptionReportCtrl = async (req, res) => {
  try {
    const data = await getSubscriptionReport(req.query);
    return res.status(200).json({ success: true, message: "Subscription report fetched.", data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/admin/reports/payments?page=1&limit=15&status=success&startDate=&endDate=&month=&year=
const getPaymentReportCtrl = async (req, res) => {
  try {
    const { page, limit, status, startDate, endDate, month, year, all } = req.query;
    const data = await getPaymentReport({ page, limit, status, startDate, endDate, month, year, all });
    return res.status(200).json({ success: true, message: "Payment report fetched.", data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/admin/analytics?year=2026&month=9&startDate=...&endDate=...&preset=...
const getAnalyticsReportCtrl = async (req, res) => {
  try {
    const data = await getAnalyticsData(req.query);
    return res.status(200).json({ success: true, message: "Analytics data fetched.", data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getReportsSummary,
  getRevenueReportCtrl,
  getUserReportCtrl,
  getSubscriptionReportCtrl,
  getPaymentReportCtrl,
  getAnalyticsReportCtrl,
};

