const mongoose = require("mongoose");
const Transaction = require("../transaction/model");
const User = require("../auth/model");

// Monthly Analytics / Trend Report
const getMonthlyAnalytics = async (userId, range = 'monthly') => {
  const now = new Date();
  const currentYear = now.getFullYear();

  if (range === 'yearly') {
    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear   = new Date(currentYear, 11, 31, 23, 59, 59, 999);
    const analytics = await Transaction.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
          $or: [
            { transactionDate: { $gte: startOfYear, $lte: endOfYear } },
            { transactionDate: { $exists: false }, createdAt: { $gte: startOfYear, $lte: endOfYear } },
          ],
        },
      },
      {
        $group: {
          _id: { month: { $month: { $ifNull: ['$transactionDate', '$createdAt'] } } },
          income:  { $sum: { $cond: [{ $eq: ['$type', 'income']  }, '$amount', 0] } },
          expense: { $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] } },
        },
      },
      { $sort: { '_id.month': 1 } },
    ]);
    return analytics;
  } else {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const analytics = await Transaction.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
          $or: [
            { transactionDate: { $gte: startOfMonth, $lte: endOfMonth } },
            { transactionDate: { $exists: false }, createdAt: { $gte: startOfMonth, $lte: endOfMonth } },
          ],
        },
      },
      {
        $group: {
          _id: { day: { $dayOfMonth: { $ifNull: ['$transactionDate', '$createdAt'] } } },
          income:  { $sum: { $cond: [{ $eq: ['$type', 'income']  }, '$amount', 0] } },
          expense: { $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] } },
        },
      },
      { $sort: { '_id.day': 1 } },
    ]);
    return analytics;
  }
};

// Category Analytics
const getCategoryAnalytics = async (userId, range = 'monthly') => {
  const now = new Date();
  let start, end;

  if (range === 'yearly') {
    start = new Date(now.getFullYear(), 0, 1);
    end   = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
  } else {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
    end   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  }

  const categories = await Transaction.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        type: 'expense',
        $or: [
          { transactionDate: { $gte: start, $lte: end } },
          { transactionDate: { $exists: false }, createdAt: { $gte: start, $lte: end } },
        ],
      },
    },
    { $group: { _id: '$category', amount: { $sum: '$amount' } } },
    { $sort: { amount: -1 } },
  ]);

  const totalExpense = categories.reduce((sum, c) => sum + c.amount, 0);

  const categoryMeta = {
    food:          { color: '#EC4899', icon: 'fast-food' },
    shopping:      { color: '#F59E0B', icon: 'bag' },
    bills:         { color: '#EF4444', icon: 'receipt' },
    entertainment: { color: '#8B5CF6', icon: 'game-controller' },
    transport:     { color: '#06B6D4', icon: 'car' },
    health:        { color: '#10B981', icon: 'heart' },
    education:     { color: '#3B82F6', icon: 'school' },
    travel:        { color: '#14B8A6', icon: 'airplane' },
    others:        { color: '#64748B', icon: 'ellipsis-horizontal' },
  };

  return categories.map((c, i) => {
    const name       = c._id || 'Others';
    const key        = name.toLowerCase();
    const meta       = categoryMeta[key] || categoryMeta.others;
    const percentage = totalExpense > 0 ? Math.round((c.amount / totalExpense) * 100) : 0;
    return { category: name, amount: c.amount, percentage, color: meta.color, icon: meta.icon };
  });
};

// Budget Utilization
const getBudgetUtilization = async (userId, range = 'monthly') => {
  const user = await User.findById(userId);
  // Default to 50000 if not set
  const monthlyBudget = (user?.monthlyBudget && user.monthlyBudget > 0)
    ? user.monthlyBudget
    : 50000;

  const now = new Date();
  let start, end, budgetLimit;

  if (range === 'yearly') {
    start = new Date(now.getFullYear(), 0, 1);
    end   = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    budgetLimit = monthlyBudget * 12;
  } else {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
    end   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    budgetLimit = monthlyBudget;
  }

  const expenses = await Transaction.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        type: 'expense',
        $or: [
          { transactionDate: { $gte: start, $lte: end } },
          { transactionDate: { $exists: false }, createdAt: { $gte: start, $lte: end } },
        ],
      },
    },
    {
      $group: { _id: null, total: { $sum: '$amount' } },
    },
  ]);

  const currentSpent = expenses.length > 0 ? expenses[0].total : 0;
  const utilizationPercentage = budgetLimit > 0
    ? Math.min(Math.round((currentSpent / budgetLimit) * 100), 100)
    : 0;
  const savingsPercentage = Math.max(100 - utilizationPercentage, 0);

  let daysRemaining = 0;
  if (range === 'yearly') {
    const daysInYear  = (now.getFullYear() % 4 === 0) ? 366 : 365;
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const diffDays    = Math.ceil(Math.abs(now - startOfYear) / (1000 * 60 * 60 * 24));
    daysRemaining = daysInYear - diffDays;
  } else {
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    daysRemaining = daysInMonth - now.getDate();
  }

  return { budgetLimit, currentSpent, utilizationPercentage, savingsPercentage, daysRemaining };
};

// Yearly Comparison
const getYearlyComparison = async (userId) => {
  const now = new Date();
  const thisYear = now.getFullYear();
  const lastYear = thisYear - 1;

  const startOfThisYear = new Date(thisYear, 0, 1);
  const endOfThisYear = new Date(thisYear, 11, 31, 23, 59, 59, 999);

  const startOfLastYear = new Date(lastYear, 0, 1);
  const endOfLastYear = new Date(lastYear, 11, 31, 23, 59, 59, 999);

  const getStats = async (start, end) => {
    const stats = await Transaction.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
          $or: [
            { transactionDate: { $gte: start, $lte: end } },
            { transactionDate: { $exists: false }, createdAt: { $gte: start, $lte: end } }
          ]
        }
      },
      {
        $group: {
          _id: "$type",
          total: { $sum: "$amount" }
        }
      }
    ]);

    let totalIncome = 0;
    let totalExpense = 0;
    stats.forEach(s => {
      if (s._id === "income") totalIncome = s.total;
      if (s._id === "expense") totalExpense = s.total;
    });

    return {
      totalIncome,
      totalExpense,
      savings: Math.max(totalIncome - totalExpense, 0)
    };
  };

  const thisYearStats = await getStats(startOfThisYear, endOfThisYear);
  const lastYearStats = await getStats(startOfLastYear, endOfLastYear);

  let growthRate = 0;
  if (lastYearStats.savings > 0) {
    growthRate = parseFloat(((thisYearStats.savings - lastYearStats.savings) / lastYearStats.savings * 100).toFixed(1));
  } else if (thisYearStats.savings > 0) {
    growthRate = 100.0;
  }

  return {
    thisYear: thisYearStats,
    lastYear: lastYearStats,
    growthRate
  };
};

module.exports = {
  getMonthlyAnalytics,
  getCategoryAnalytics,
  getBudgetUtilization,
  getYearlyComparison,
};
