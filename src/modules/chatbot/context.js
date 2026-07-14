const Transaction = require("../transaction/model");
const User = require("../auth/model");

const buildFinanceContext = async (userId) => {
  const user = await User.findById(userId);

  const transactions = await Transaction.find({
    user: userId,
  })
    .sort({ transactionDate: -1 })
    .limit(20);

  let income = 0;
  let expense = 0;

  transactions.forEach((item) => {
    if (item.type === "income") {
      income += item.amount;
    } else {
      expense += item.amount;
    }
  });

  return {
    user,
    income,
    expense,
    remainingBudget:
      user.monthlyBudget - expense,
    transactions,
  };
};

module.exports = buildFinanceContext;