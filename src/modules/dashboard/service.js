const mongoose = require("mongoose");
const Transaction = require("../transaction/model");
const User = require("../auth/model");
// Dashboard Summary
const getDashboardSummary = async (userId) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const transactions = await Transaction.find({
    user: userId,
    $or: [
      { transactionDate: { $gte: startOfMonth, $lte: endOfMonth } },
      { transactionDate: { $exists: false }, createdAt: { $gte: startOfMonth, $lte: endOfMonth } },
    ],
  });

  let totalIncome = 0;
  let totalExpense = 0;

  transactions.forEach((transaction) => {
    if (transaction.type === "income") {
      totalIncome += transaction.amount;
    } else {
      totalExpense += transaction.amount;
    }
  });

  return {
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
    transactionCount: transactions.length,
  };
};

// Recent Transactions
const getRecentTransactions = async (userId) => {
  return await Transaction.find({
    user: userId,
  })
    .sort({ createdAt: -1 })
    .limit(5);
};

module.exports = {
  getDashboardSummary,
  getRecentTransactions,
};