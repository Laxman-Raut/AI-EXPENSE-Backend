const mongoose = require("mongoose");
const Transaction = require("../transaction/model");
const User = require("../auth/model");
const currencyService = require("../currency/service");

// Helper to pick historical pre-calculated snapshot based on user's target currency
const getStoredAmountForUser = (t, targetCurrency, rate = 95.24) => {
  if (targetCurrency === 'USD') {
    if (t.amountUSD !== null && t.amountUSD !== undefined) {
      return t.amountUSD;
    }
    return t.currency === 'USD' ? t.amount : Number((t.amount / rate).toFixed(2));
  }
  if (t.amountINR !== null && t.amountINR !== undefined) {
    return t.amountINR;
  }
  return t.currency === 'INR' ? t.amount : Number((t.amount * rate).toFixed(2));
};

const resolveDateRange = (options = {}) => {
  const opts = typeof options === "string" ? { range: options } : (options || {});
  const { range = "monthly", month, year, startDate, endDate } = opts;
  const now = new Date();
  const currentYear = year ? parseInt(year, 10) : now.getFullYear();

  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return { start, end, type: "custom" };
    }
  }

  if (month !== undefined && month !== null && month !== "") {
    const m = parseInt(month, 10);
    const monthIndex = m >= 1 && m <= 12 ? m - 1 : (m >= 0 && m <= 11 ? m : now.getMonth());
    const start = new Date(currentYear, monthIndex, 1);
    const end = new Date(currentYear, monthIndex + 1, 0, 23, 59, 59, 999);
    return { start, end, type: "monthly", month: monthIndex + 1, year: currentYear };
  }

  if (range === "yearly") {
    const start = new Date(currentYear, 0, 1);
    const end = new Date(currentYear, 11, 31, 23, 59, 59, 999);
    return { start, end, type: "yearly", year: currentYear };
  }

  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end, type: "monthly", month: now.getMonth() + 1, year: now.getFullYear() };
};

// Monthly Analytics / Trend Report
const getMonthlyAnalytics = async (userId, options = "monthly") => {
  const user = await User.findById(userId);
  const targetCurrency = user?.currency || "INR";

  const { start, end, type } = resolveDateRange(options);

  const transactions = await Transaction.find({
    user: userId,
    $or: [
      { transactionDate: { $gte: start, $lte: end } },
      { transactionDate: { $exists: false }, createdAt: { $gte: start, $lte: end } },
    ],
  }).lean();

  const map = new Map();

  transactions.forEach((t) => {
    const d = new Date(t.transactionDate || t.createdAt);
    let key;
    if (type === "yearly") {
      key = d.getMonth() + 1;
    } else if (type === "custom") {
      key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    } else {
      key = d.getDate();
    }
    const converted = getStoredAmountForUser(t, targetCurrency);

    if (!map.has(key)) {
      map.set(key, { income: 0, expense: 0 });
    }
    const entry = map.get(key);
    if (t.type === "income") entry.income += converted;
    if (t.type === "expense") entry.expense += converted;
  });

  const result = [];
  const sortedKeys = Array.from(map.keys()).sort((a, b) => (typeof a === "number" ? a - b : String(a).localeCompare(String(b))));
  sortedKeys.forEach((k) => {
    const val = map.get(k);
    if (type === "yearly") {
      result.push({ _id: { month: k }, income: Number(val.income.toFixed(2)), expense: Number(val.expense.toFixed(2)) });
    } else if (type === "custom") {
      result.push({ _id: { date: k }, income: Number(val.income.toFixed(2)), expense: Number(val.expense.toFixed(2)) });
    } else {
      result.push({ _id: { day: k }, income: Number(val.income.toFixed(2)), expense: Number(val.expense.toFixed(2)) });
    }
  });

  return result;
};

// Category Analytics
const getCategoryAnalytics = async (userId, options = "monthly") => {
  const user = await User.findById(userId);
  const targetCurrency = user?.currency || "INR";

  const { start, end } = resolveDateRange(options);

  const transactions = await Transaction.find({
    user: userId,
    type: "expense",
    $or: [
      { transactionDate: { $gte: start, $lte: end } },
      { transactionDate: { $exists: false }, createdAt: { $gte: start, $lte: end } },
    ],
  }).lean();

  const catMap = new Map();
  transactions.forEach((t) => {
    const cat = t.category || "Others";
    const converted = getStoredAmountForUser(t, targetCurrency);
    catMap.set(cat, (catMap.get(cat) || 0) + converted);
  });

  const categories = Array.from(catMap.entries())
    .map(([cat, amt]) => ({ _id: cat, amount: Number(amt.toFixed(2)) }))
    .sort((a, b) => b.amount - a.amount);

  const totalExpense = categories.reduce((sum, c) => sum + c.amount, 0);

  const categoryMeta = {
    food: { color: "#EC4899", icon: "fast-food" },
    shopping: { color: "#F59E0B", icon: "bag" },
    bills: { color: "#EF4444", icon: "receipt" },
    entertainment: { color: "#8B5CF6", icon: "game-controller" },
    transport: { color: "#06B6D4", icon: "car" },
    health: { color: "#10B981", icon: "heart" },
    education: { color: "#3B82F6", icon: "school" },
    travel: { color: "#14B8A6", icon: "airplane" },
    others: { color: "#64748B", icon: "ellipse" },
  };

  return categories.map((c) => {
    const name = c._id || "Others";
    const key = name.toLowerCase();
    const meta = categoryMeta[key] || categoryMeta.others;
    const percentage = totalExpense > 0 ? Math.round((c.amount / totalExpense) * 100) : 0;
    return { category: name, amount: c.amount, percentage, color: meta.color, icon: meta.icon, currency: targetCurrency };
  });
};

// Budget Utilization
const getBudgetUtilization = async (userId, options = "monthly") => {
  const user = await User.findById(userId);
  const targetCurrency = user?.currency || "INR";
  const rates = await currencyService.getRatesMap();

  const rawMonthlyBudget = (user?.monthlyBudget && user.monthlyBudget > 0) ? user.monthlyBudget : 50000;
  const monthlyBudget = currencyService.convertAmountWithRates(rawMonthlyBudget, "INR", targetCurrency, rates);

  const { start, end, type } = resolveDateRange(options);
  let budgetLimit = monthlyBudget;
  if (type === "yearly") {
    budgetLimit = monthlyBudget * 12;
  } else if (type === "custom") {
    const diffDays = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
    budgetLimit = Number(((monthlyBudget / 30) * diffDays).toFixed(2));
  }

  const transactions = await Transaction.find({
    user: userId,
    type: "expense",
    $or: [
      { transactionDate: { $gte: start, $lte: end } },
      { transactionDate: { $exists: false }, createdAt: { $gte: start, $lte: end } },
    ],
  }).lean();

  let currentSpent = 0;
  transactions.forEach((t) => {
    currentSpent += getStoredAmountForUser(t, targetCurrency);
  });

  currentSpent = Number(currentSpent.toFixed(2));
  budgetLimit = Number(budgetLimit.toFixed(2));

  const utilizationPercentage = budgetLimit > 0
    ? Math.min(Math.round((currentSpent / budgetLimit) * 100), 100)
    : 0;
  const savingsPercentage = Math.max(100 - utilizationPercentage, 0);

  let daysRemaining = 0;
  if (range === 'yearly') {
    const daysInYear = (now.getFullYear() % 4 === 0) ? 366 : 365;
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const diffDays = Math.ceil(Math.abs(now - startOfYear) / (1000 * 60 * 60 * 24));
    daysRemaining = daysInYear - diffDays;
  } else {
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    daysRemaining = daysInMonth - now.getDate();
  }

  return { budgetLimit, currentSpent, utilizationPercentage, savingsPercentage, daysRemaining, currency: targetCurrency };
};

// Yearly Comparison
const getYearlyComparison = async (userId) => {
  const user = await User.findById(userId);
  const targetCurrency = user?.currency || 'INR';

  const now = new Date();
  const thisYear = now.getFullYear();
  const lastYear = thisYear - 1;

  const startOfThisYear = new Date(thisYear, 0, 1);
  const endOfThisYear = new Date(thisYear, 11, 31, 23, 59, 59, 999);

  const startOfLastYear = new Date(lastYear, 0, 1);
  const endOfLastYear = new Date(lastYear, 11, 31, 23, 59, 59, 999);

  const getStats = async (start, end) => {
    const transactions = await Transaction.find({
      user: userId,
      $or: [
        { transactionDate: { $gte: start, $lte: end } },
        { transactionDate: { $exists: false }, createdAt: { $gte: start, $lte: end } }
      ]
    }).lean();

    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach((t) => {
      const converted = getStoredAmountForUser(t, targetCurrency);
      if (t.type === 'income') totalIncome += converted;
      if (t.type === 'expense') totalExpense += converted;
    });

    totalIncome = Number(totalIncome.toFixed(2));
    totalExpense = Number(totalExpense.toFixed(2));

    return {
      totalIncome,
      totalExpense,
      savings: Number(Math.max(totalIncome - totalExpense, 0).toFixed(2))
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
    growthRate,
    currency: targetCurrency,
  };
};

module.exports = {
  getMonthlyAnalytics,
  getCategoryAnalytics,
  getBudgetUtilization,
  getYearlyComparison,
};

