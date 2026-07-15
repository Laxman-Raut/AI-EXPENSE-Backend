const Transaction = require("../transaction/model");
const User = require("../auth/model");

const buildFinanceContext = async (userId) => {
  const user = await User.findById(userId);

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  // Calculate monthly totals based on all transactions this month
  const monthlyTransactions = await Transaction.find({
    user: userId,
    $or: [
      { transactionDate: { $gte: startOfMonth, $lte: endOfMonth } },
      { transactionDate: { $exists: false }, createdAt: { $gte: startOfMonth, $lte: endOfMonth } },
    ],
  });

  let income = 0;
  let expense = 0;

  monthlyTransactions.forEach((item) => {
    if (item.type === "income") {
      income += item.amount;
    } else {
      expense += item.amount;
    }
  });

  // Fetch the 20 most recent transactions overall for conversation context
  const transactions = await Transaction.find({
    user: userId,
  })
    .sort({ transactionDate: -1 })
    .limit(20);

  const monthlyBudget = user ? user.monthlyBudget : 0;

  return {
    user,
    income,
    expense,
    remainingBudget: monthlyBudget - expense,
    transactions,
  };
};

module.exports = buildFinanceContext;