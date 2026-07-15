const Transaction = require("./model");
const User = require("../auth/model");
const { createNotification } = require("../notification/service");

// Create Transaction
const createTransaction = async (transactionData, userId) => {
  const transaction = await Transaction.create({
    ...transactionData,
    user: userId,
  });

  try {
    // 1. Send transaction addition notification
    const typeLabel = transaction.type === "income" ? "Income" : "Expense";
    await createNotification({
      user: userId,
      title: `New ${typeLabel} Added`,
      body: `You successfully added ${typeLabel.toLowerCase()} of ${transaction.amount} for ${transaction.category}.`,
      type: transaction.type === "income" ? "income" : "expense",
      data: { transactionId: transaction._id }
    });

    // 2. Budget burn notification (only for expense)
    if (transaction.type === "expense") {
      const user = await User.findById(userId);
      if (user && user.monthlyBudget > 0) {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

        // Fetch all expenses in the current month
        const monthlyExpenses = await Transaction.find({
          user: userId,
          type: "expense",
          $or: [
            { transactionDate: { $gte: startOfMonth, $lte: endOfMonth } },
            { transactionDate: { $exists: false }, createdAt: { $gte: startOfMonth, $lte: endOfMonth } },
          ],
        });

        const totalExpense = monthlyExpenses.reduce((sum, item) => sum + item.amount, 0);
        const prevExpense = totalExpense - transaction.amount;

        const prevPercent = (prevExpense / user.monthlyBudget) * 100;
        const newPercent = (totalExpense / user.monthlyBudget) * 100;

        // Check if we crossed any 10% threshold (10, 20, 30, ..., 100)
        for (let threshold = 10; threshold <= 100; threshold += 10) {
          if (prevPercent < threshold && newPercent >= threshold) {
            await createNotification({
              user: userId,
              title: "Budget Burn Warning",
              body: `You have spent ${threshold}% of your monthly budget.`,
              type: "budget",
              data: { threshold, totalExpense, monthlyBudget: user.monthlyBudget }
            });
          }
        }
      }
    }
  } catch (notificationError) {
    console.error("Failed to trigger transaction/budget notification:", notificationError);
  }

  return transaction;
};

// Get All Transactions
const getTransactions = async (userId) => {
  return await Transaction.find({ user: userId }).sort({
    transactionDate: -1,
  });
};

const getTransactionById = async (id, userId) => {
  const transaction = await Transaction.findOne({
    _id: id,
    user: userId,
  });

  if (!transaction) {
    throw new Error("Transaction not found");
  }

  return transaction;
};
const updateTransaction = async (id, userId, updateData) => {
  const transaction = await Transaction.findOneAndUpdate(
    { _id: id, user: userId },
    updateData,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!transaction) {
    throw new Error("Transaction not found");
  }

  return transaction;
};

const deleteTransaction = async (id, userId) => {
  const transaction = await Transaction.findOneAndDelete({
    _id: id,
    user: userId,
  });

  if (!transaction) {
    throw new Error("Transaction not found");
  }

  return transaction;
};


module.exports = {
  createTransaction,
  getTransactions,
   getTransactionById,
   updateTransaction,
   deleteTransaction,
};