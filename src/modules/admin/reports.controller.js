const {
  getReportSummary,
  getRevenueReport,
  getUserReport,
  getSubscriptionReport,
  getPaymentReport,
} = require("./reports.repository");

// GET /api/v1/admin/reports/summary
const getReportsSummary = async (req, res) => {
  try {
    const data = await getReportSummary();
    return res.status(200).json({ success: true, message: "Report summary fetched.", data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/admin/reports/revenue?year=2025
const getRevenueReportCtrl = async (req, res) => {
  try {
    const { year } = req.query;
    const data = await getRevenueReport(year ? Number(year) : undefined);
    return res.status(200).json({ success: true, message: "Revenue report fetched.", data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/admin/reports/users
const getUserReportCtrl = async (req, res) => {
  try {
    const data = await getUserReport();
    return res.status(200).json({ success: true, message: "User report fetched.", data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/admin/reports/subscriptions
const getSubscriptionReportCtrl = async (req, res) => {
  try {
    const data = await getSubscriptionReport();
    return res.status(200).json({ success: true, message: "Subscription report fetched.", data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/admin/reports/payments?page=1&limit=15&status=success&startDate=&endDate=
const getPaymentReportCtrl = async (req, res) => {
  try {
    const { page, limit, status, startDate, endDate } = req.query;
    const data = await getPaymentReport({ page, limit, status, startDate, endDate });
    return res.status(200).json({ success: true, message: "Payment report fetched.", data });
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
};
