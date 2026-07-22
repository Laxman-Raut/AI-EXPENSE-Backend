const Transaction = require("./model");
const User = require("../auth/model");
const { createNotification } = require("../notification/service");

const checkBudgetLimitsAndNotify = async (userId, category, amount, isExpense) => {
  if (!isExpense) return;
  try {
    const user = await User.findById(userId);
    if (!user) return;

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
    const prevExpense = totalExpense - amount;

    // 1. Overall Monthly Budget Check
    if (user.monthlyBudget > 0) {
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

    // 2. Category Budget Check
    // If the user has categoryBudgets map, see if there is a limit set for this category
    const categoryBudgetLimit = user.categoryBudgets && typeof user.categoryBudgets.get === "function"
      ? user.categoryBudgets.get(category)
      : (user.categoryBudgets ? user.categoryBudgets[category] : null);

    if (categoryBudgetLimit && categoryBudgetLimit > 0) {
      const categoryExpenses = monthlyExpenses.filter(item => item.category === category);
      const totalCategoryExpense = categoryExpenses.reduce((sum, item) => sum + item.amount, 0);
      const prevCategoryExpense = totalCategoryExpense - amount;

      const prevCategoryPercent = (prevCategoryExpense / categoryBudgetLimit) * 100;
      const newCategoryPercent = (totalCategoryExpense / categoryBudgetLimit) * 100;

      // Warning when crossing 80%
      if (prevCategoryPercent < 80 && newCategoryPercent >= 80 && newCategoryPercent < 100) {
        await createNotification({
          user: userId,
          title: "Category Budget Warning",
          body: `You have spent 80% of your budget limit of ${categoryBudgetLimit} for category "${category}".`,
          type: "budget",
          data: { category, totalExpense: totalCategoryExpense, budgetLimit: categoryBudgetLimit }
        });
      }

      // Exceeded when crossing 100%
      if (prevCategoryPercent < 100 && newCategoryPercent >= 100) {
        await createNotification({
          user: userId,
          title: "Category Budget Exceeded",
          body: `Your expenses for category "${category}" have exceeded your budget limit of ${categoryBudgetLimit}.`,
          type: "budget",
          data: { category, totalExpense: totalCategoryExpense, budgetLimit: categoryBudgetLimit }
        });
      }
    }
  } catch (err) {
    console.error("Failed to run budget checks:", err);
  }
};

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

    // 2. Budget checks and notifications
    await checkBudgetLimitsAndNotify(userId, transaction.category, transaction.amount, transaction.type === "expense");
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

  try {
    await checkBudgetLimitsAndNotify(userId, transaction.category, transaction.amount, transaction.type === "expense");
  } catch (err) {
    console.error("Failed to run budget checks on update:", err);
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


const syncTransactions = async (userId, transactions = []) => {
  const results = [];
  for (const item of transactions) {
    const localId = item.localId || item.id;
    const transactionData = {
      user: userId,
      type: item.type,
      category: item.category,
      description: item.description,
      amount: item.amount,
      paymentMethod: item.paymentMethod || "UPI",
      transactionDate: item.transactionDate ? new Date(item.transactionDate) : new Date(),
      note: item.note || "",
    };

    let doc;
    if (item.cloudId && item.cloudId !== "null" && item.cloudId !== "undefined") {
      doc = await Transaction.findOneAndUpdate(
        { _id: item.cloudId, user: userId },
        transactionData,
        { new: true, upsert: true }
      );
    } else {
      doc = await Transaction.create(transactionData);
    }

    results.push({
      localId: localId,
      cloudId: doc._id.toString(),
    });
  }
  return results;
};

module.exports = {
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  syncTransactions,
};