const {
  getDailyTransactions,
  getMonthlySummary,
  getCalendarStats,
  getCalendarTimeline,
  getDailySummary,
  getCalendarHeatmap
} = require("./service");

// GET /api/calendar/date/:date
const getDailyTxns = async (req, res) => {
  try {
    const transactions = await getDailyTransactions(req.params.date, req.user.userId);
    res.status(200).json({
      success: true,
      data: transactions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET /api/calendar/month/:year/:month
const getMonthSummary = async (req, res) => {
  try {
    const summary = await getMonthlySummary(
      Number(req.params.year),
      Number(req.params.month),
      req.user.userId
    );
    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET /api/calendar/stats/:year/:month
const getStats = async (req, res) => {
  try {
    const stats = await getCalendarStats(
      Number(req.params.year),
      Number(req.params.month),
      req.user.userId
    );
    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET /api/calendar/timeline
const getTimeline = async (req, res) => {
  try {
    const timeline = await getCalendarTimeline(
      req.query.startDate,
      req.query.endDate,
      req.user.userId
    );
    res.status(200).json({
      success: true,
      data: timeline,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET /api/calendar/summary/:date
const getDaySummary = async (req, res) => {
  try {
    const summary = await getDailySummary(req.params.date, req.user.userId);
    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET /api/calendar/heatmap/:year/:month
const getHeatmap = async (req, res) => {
  try {
    const heatmap = await getCalendarHeatmap(
      Number(req.params.year),
      Number(req.params.month),
      req.user.userId
    );
    res.status(200).json({
      success: true,
      data: heatmap,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getDailyTxns,
  getMonthSummary,
  getStats,
  getTimeline,
  getDaySummary,
  getHeatmap,
};