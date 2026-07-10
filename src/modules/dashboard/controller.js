const {
  getDashboardSummary,
  getRecentTransactions,
} = require("./service");
const dashboardSummary = async (req, res) => {
  try {
    const summary = await getDashboardSummary(req.user.userId);

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

const recentTransactions = async (req, res) => {
  try {
    const transactions = await getRecentTransactions(req.user.userId);

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

module.exports = {
  dashboardSummary,
  recentTransactions,
};