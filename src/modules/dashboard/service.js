const Transaction = require("../transaction/model");
const User = require("../auth/model");
const currencyService = require("../currency/service");
const {
  normalizeCurrency,
  selectStoredAmount,
  aggregateTransactions,
  buildBudgetSnapshot,
} = require("../financial/service");

const buildTrend = (transactions, targetCurrency) => {
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, idx) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - idx), 1);
    return {
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleString("en-US", { month: "short" }),
      income: 0,
      expense: 0,
    };
  });

  transactions.forEach((tx) => {
    const txDate = tx.transactionDate ? new Date(tx.transactionDate) : new Date(tx.createdAt || Date.now());
    const key = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, "0")}`;
    const slot = months.find((m) => m.key === key);
    if (!slot) return;

    const amount = selectStoredAmount(tx, targetCurrency);
    if (tx.type === "income") slot.income += amount;
    if (tx.type === "expense") slot.expense += amount;
  });

  return months.map((m) => ({
    label: m.label,
    income: Number(m.income.toFixed(2)),
    expense: Number(m.expense.toFixed(2)),
    savings: Number(Math.max(m.income - m.expense, 0).toFixed(2)),
  }));
};

const buildCategoryBreakdown = (transactions, targetCurrency) => {
  const expenseMap = new Map();
  transactions
    .filter((tx) => tx.type === "expense")
    .forEach((tx) => {
      const cat = tx.category || "Others";
      const amount = selectStoredAmount(tx, targetCurrency);
      expenseMap.set(cat, (expenseMap.get(cat) || 0) + amount);
    });

  const total = Array.from(expenseMap.values()).reduce((sum, val) => sum + val, 0);
  return Array.from(expenseMap.entries())
    .map(([category, amount]) => ({
      category,
      amount: Number(amount.toFixed(2)),
      percentage: total > 0 ? Number(((amount / total) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
};

const getDashboardSummary = async (userId) => {
  const user = await User.findById(userId).lean();
  const userCurrency = normalizeCurrency(user?.currency || "INR");

  const transactions = await Transaction.find({ user: userId })
    .populate("bankAccount", "bankName nickname accountNumber isPrimary")
    .select(
      "type category description amount currency originalAmount originalCurrency amountINR amountUSD exchangeRate exchangeRateTimestamp transactionDate createdAt bankAccount note paymentMethod"
    )
    .sort({ transactionDate: -1, createdAt: -1 })
    .lean();

  const totals = aggregateTransactions(transactions, userCurrency);
  const budgetSnapshot = await buildBudgetSnapshot(user, userCurrency, totals.monthlyExpense);

  const recentTransactions = transactions.slice(0, 5);

  const monthTrend = buildTrend(transactions, userCurrency);
  const categoryBreakdown = buildCategoryBreakdown(transactions, userCurrency);
  const spentPercentage = totals.incomeSpentVsSaved.spentPercentage;
  const savedPercentage = totals.incomeSpentVsSaved.savedPercentage;

  return {
    ...totals,
    currency: userCurrency,
    transactionCount: transactions.length,
    incomeSpentVsSaved: {
      ...totals.incomeSpentVsSaved,
    },
    monthlyBudgetLimit: budgetSnapshot,
    recentTransactions: recentTransactions.map((tx) => ({
      ...tx,
      amount: selectStoredAmount(tx, userCurrency),
      currency: userCurrency,
    })),
    trend: monthTrend,
    categoryBreakdown,
    spentPercentage,
    savedPercentage,
  };
};

const getRecentTransactions = async (userId) => {
  const user = await User.findById(userId).lean();
  const userCurrency = normalizeCurrency(user?.currency || "INR");

  const txs = await Transaction.find({ user: userId })
    .populate("bankAccount", "bankName nickname accountNumber isPrimary")
    .select(
      "type category description amount currency originalAmount originalCurrency amountINR amountUSD exchangeRate exchangeRateTimestamp transactionDate createdAt bankAccount note paymentMethod"
    )
    .sort({ transactionDate: -1, createdAt: -1 })
    .limit(5)
    .lean();

  return txs.map((tx) => ({
    ...tx,
    amount: selectStoredAmount(tx, userCurrency),
    currency: userCurrency,
  }));
};

module.exports = {
  getDashboardSummary,
  getRecentTransactions,
};
