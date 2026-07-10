const {
  getMonthlyAnalytics,
  getCategoryAnalytics,
  getBudgetUtilization,
  getYearlyComparison,
} = require("./service");

const monthlyAnalytics = async (req, res) => {
  try {
    const { range } = req.query;
    const analytics = await getMonthlyAnalytics(req.user.userId, range);

    res.status(200).json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const categoryAnalytics = async (req, res) => {
  try {
    const { range } = req.query;
    const analytics = await getCategoryAnalytics(req.user.userId, range);

    res.status(200).json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const budgetUtilization = async (req, res) => {
  try {
    const { range } = req.query;
    const budget = await getBudgetUtilization(req.user.userId, range);

    res.status(200).json({
      success: true,
      data: budget,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const yearlyComparison = async (req, res) => {
  try {
    const comparison = await getYearlyComparison(req.user.userId);

    res.status(200).json({
      success: true,
      data: comparison,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  monthlyAnalytics,
  categoryAnalytics,
  budgetUtilization,
  yearlyComparison,
};
