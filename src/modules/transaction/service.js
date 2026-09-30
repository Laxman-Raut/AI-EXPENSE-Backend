
const {
  getRatesMap,
  convertAmountWithRates,
  createCurrencySnapshot,
} = require("../currency/service");
const {
  hydrateTransaction,
  selectStoredAmount,
  normalizeCurrency,
} = require("../financial/service");
const Transaction = require("./model");
const Bank = require("../bank/model");
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

    const totalExpense = monthlyExpenses.reduce((sum, item) => sum + (item.amountINR || item.amount || 0), 0);
    const prevExpense = totalExpense - amount;

    // 1. Overall Monthly Budget Check
    const budgetINR = (user.monthlyBudgetINR && user.monthlyBudgetINR > 0)
      ? user.monthlyBudgetINR
      : (user.monthlyBudget || 0);

    if (budgetINR > 0) {
      const prevPercent = (prevExpense / budgetINR) * 100;
      const newPercent = (totalExpense / budgetINR) * 100;

      // Milestone and warning thresholds: 50%, 80%, 100%
      const thresholds = [50, 80, 100];
      for (const threshold of thresholds) {
        if (prevPercent < threshold && newPercent >= threshold) {
          const isFull = threshold === 100;
          await createNotification({
            user: userId,
            title: isFull ? "⚠️ Monthly Budget Reached" : `📊 Budget Alert: ${threshold}% Spent`,
            body: isFull
              ? `You have reached 100% of your monthly budget (₹${Math.round(totalExpense)} of ₹${Math.round(budgetINR)}).`
              : `You have spent ${threshold}% of your monthly budget (₹${Math.round(totalExpense)} of ₹${Math.round(budgetINR)}).`,
            type: "budget",
            data: {
              screen: "Budget",
              threshold,
              totalExpense: Math.round(totalExpense),
              monthlyBudget: Math.round(budgetINR),
            },
          });
        }
      }

      // If budget is exceeded (> 100%)
      if (prevPercent <= 100 && newPercent > 100) {
        const excess = Math.round(totalExpense - budgetINR);
        await createNotification({
          user: userId,
          title: "🚨 Monthly Budget Exceeded!",
          body: `Your spending this month has exceeded your monthly budget by ₹${excess}. Total spent: ₹${Math.round(totalExpense)} / ₹${Math.round(budgetINR)}.`,
          type: "budget",
          data: {
            screen: "Budget",
            threshold: 100,
            excess,
            totalExpense: Math.round(totalExpense),
            monthlyBudget: Math.round(budgetINR),
          },
        });
      }
    }

    // 2. Category Budget Check
    // If the user has categoryBudgets map, see if there is a limit set for this category
    const categoryBudgetLimit = user.categoryBudgets && typeof user.categoryBudgets.get === "function"
      ? user.categoryBudgets.get(category)
      : (user.categoryBudgets ? user.categoryBudgets[category] : null);

    if (categoryBudgetLimit && categoryBudgetLimit > 0) {
      const categoryExpenses = monthlyExpenses.filter(item => item.category === category);
      const totalCategoryExpense = categoryExpenses.reduce((sum, item) => sum + (item.amountINR || item.amount || 0), 0);
      const prevCategoryExpense = totalCategoryExpense - amount;

      const prevCategoryPercent = (prevCategoryExpense / categoryBudgetLimit) * 100;
      const newCategoryPercent = (totalCategoryExpense / categoryBudgetLimit) * 100;

      // Warning when crossing 80%
      if (prevCategoryPercent < 80 && newCategoryPercent >= 80 && newCategoryPercent < 100) {
        await createNotification({
          user: userId,
          title: `⚠️ ${category} Budget Warning`,
          body: `You have spent 80% of your budget for "${category}" (₹${Math.round(totalCategoryExpense)} of ₹${Math.round(categoryBudgetLimit)}).`,
          type: "budget",
          data: {
            screen: "Budget",
            category,
            totalExpense: Math.round(totalCategoryExpense),
            budgetLimit: Math.round(categoryBudgetLimit),
          },
        });
      }

      // Exceeded when crossing 100%
      if (prevCategoryPercent < 100 && newCategoryPercent >= 100) {
        const excess = Math.round(totalCategoryExpense - categoryBudgetLimit);
        await createNotification({
          user: userId,
          title: `🚨 ${category} Budget Exceeded!`,
          body: `Your expenses for "${category}" have exceeded your budget by ₹${excess}. Total spent: ₹${Math.round(totalCategoryExpense)} / ₹${Math.round(categoryBudgetLimit)}.`,
          type: "budget",
          data: {
            screen: "Budget",
            category,
            excess,
            totalExpense: Math.round(totalCategoryExpense),
            budgetLimit: Math.round(categoryBudgetLimit),
          },
        });
      }
    }
  } catch (err) {
    console.error("Failed to run budget checks:", err);
  }
};

// Create Transaction
const createTransaction = async (transactionData, userId) => {
  const user = await User.findById(userId);
  const txCurrency = normalizeCurrency(transactionData.currency || user?.currency || "INR");

  // Create dual-currency snapshot at creation time
  const snapshot = await createCurrencySnapshot(transactionData.amount, txCurrency);

  let transaction = await Transaction.create({
    ...transactionData,
    currency: txCurrency,
    user: userId,
    ...snapshot,
  });

  if (transaction.bankAccount) {
    transaction = await transaction.populate("bankAccount");
  }

  // Run budget threshold checks asynchronously in background
  // (Noisy self-action "New Expense Added" confirmation is omitted so user only gets actionable alerts)
  setImmediate(async () => {
    try {
      await checkBudgetLimitsAndNotify(
        userId,
        transaction.category,
        transaction.amountINR || transaction.amount,
        transaction.type === "expense"
      );
    } catch (notificationError) {
      console.error("Failed to trigger budget notification:", notificationError);
    }
  });

  return transaction;
};

// Get All Transactions
const getTransactions = async (userId, userCurrency = null) => {
  // User.findById extra query hatayi — currency param se lo ya default INR
  const userCurr = normalizeCurrency(userCurrency || "INR");

  const transactions = await Transaction.find({ user: userId })
    .populate("bankAccount", "bankName nickname accountNumber isPrimary")
    .sort({
      transactionDate: -1,
    })
    .lean();

  return transactions.map((tx) => hydrateTransaction(tx, userCurr));
};


const getTransactionById = async (id, userId, userCurrency = null) => {
  // User.findById extra query hatayi — currency param se lo ya default INR
  const userCurr = normalizeCurrency(userCurrency || "INR");
  const transaction = await Transaction.findOne({
    _id: id,
    user: userId,
  }).populate("bankAccount");

  if (!transaction) {
    throw new Error("Transaction not found");
  }

  return hydrateTransaction(transaction.toObject ? transaction.toObject() : transaction, userCurr);
};
const updateTransaction = async (id, userId, updateData) => {
  const existing = await Transaction.findOne({ _id: id, user: userId });
  if (!existing) {
    throw new Error("Transaction not found");
  }

  let finalUpdateData = { ...updateData };
  if (updateData.amount !== undefined || updateData.currency !== undefined) {
    const newAmt = updateData.amount !== undefined ? updateData.amount : existing.amount;
    const newCurr = normalizeCurrency(updateData.currency !== undefined ? updateData.currency : (existing.currency || "INR"));
    const snapshot = await createCurrencySnapshot(newAmt, newCurr);
    finalUpdateData = {
      ...finalUpdateData,
      amount: newAmt,
      currency: newCurr,
      ...snapshot,
    };
  }

  const transaction = await Transaction.findOneAndUpdate(
    { _id: id, user: userId },
    finalUpdateData,
    {
      new: true,
      runValidators: true,
    }
  ).populate("bankAccount");

  try {
    await checkBudgetLimitsAndNotify(userId, transaction.category, transaction.amountINR || transaction.amount, transaction.type === "expense");
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
  const user = await User.findById(userId);
  const results = [];

  // Currency snapshots parallel create karo (chunks of 10)
  // Sequential await ki jagah Promise.all use kiya — significantly faster
  const CHUNK_SIZE = 10;
  for (let i = 0; i < transactions.length; i += CHUNK_SIZE) {
    const chunk = transactions.slice(i, i + CHUNK_SIZE);
    const chunkResults = await Promise.all(
      chunk.map(async (item) => {
        const localId = item.localId || item.id;
        const itemCurr = normalizeCurrency(item.currency || user?.currency || "INR");
        const snapshot = await createCurrencySnapshot(item.amount, itemCurr);

        const transactionData = {
          user: userId,
          type: item.type,
          category: item.category,
          description: item.description,
          amount: item.amount,
          currency: itemCurr,
          ...snapshot,
          paymentMethod: item.paymentMethod || "UPI",
          transactionDate: item.transactionDate ? new Date(item.transactionDate) : new Date(),
          note: item.note || "",
          bankAccount: item.bankAccount || null,
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

        return {
          localId: localId,
          cloudId: doc._id.toString(),
        };
      })
    );
    results.push(...chunkResults);
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
