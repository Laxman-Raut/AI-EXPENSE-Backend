
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
const Notification = require("../notification/model");
const { createNotification } = require("../notification/service");
const {
  getPendingBudgetThresholds,
  getSentThresholdsForBudget,
} = require("./budgetThresholds");

const getBudgetKey = (amount) => Number(amount).toFixed(2);

const budgetSnapshotMatchQuery = (budgetKey, legacyField, budgetAmount) => ({
  $or: [
    { "data.budgetKey": budgetKey },
    {
      $and: [
        { "data.budgetKey": { $exists: false } },
        { [`data.${legacyField}`]: Math.round(budgetAmount) },
      ],
    },
  ],
});

const checkBudgetLimitsAndNotify = async (
  userId,
  category,
  amount,
  isExpense,
  { monthlyBudgetUpdated = false, categoryBudgetUpdated = false, categoryOnly = false } = {},
) => {
  if (!isExpense) return;
  try {
    const user = await User.findById(userId);
    if (!user) return;

    const now = new Date();
    // Start and end of current month in UTC & local tolerant boundaries
    const startOfMonth = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0));
    const endOfMonth = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999));

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

    // 1. Overall Monthly Budget Check
    const budgetINR = (user.monthlyBudgetINR && user.monthlyBudgetINR > 0)
      ? user.monthlyBudgetINR
      : (user.monthlyBudget || 0);

    if (!categoryOnly && budgetINR > 0) {
      const currentPercent = (totalExpense / budgetINR) * 100;
      const budgetKey = getBudgetKey(budgetINR);

      // Find ALL already-sent budget thresholds for this month to avoid duplicates
      const alreadySentNotifications = await Notification.find({
        user: userId,
        type: "budget",
        "data.threshold": { $exists: true },
        "data.category": { $exists: false },
        createdAt: { $gte: startOfMonth, $lte: endOfMonth },
      }).select("data.threshold data.monthlyBudget data.budgetKey").lean();

      const alreadySentThresholds = getSentThresholdsForBudget(
        alreadySentNotifications,
        budgetKey,
        budgetINR,
        "monthlyBudget",
      );

      for (const threshold of getPendingBudgetThresholds(currentPercent, alreadySentThresholds, {
        budgetUpdated: monthlyBudgetUpdated,
      })) {
        if (threshold === "exceeded") {
          const excess = Math.round(totalExpense - budgetINR);
          await createNotification({
            user: userId,
            title: "🚨 Monthly Budget Exceeded!",
            body: `Your spending this month has exceeded your monthly budget by ₹${excess}. Total spent: ₹${Math.round(totalExpense)} / ₹${Math.round(budgetINR)}.`,
            type: "budget",
            data: {
              screen: "Budget",
              threshold: "exceeded",
              excess,
              totalExpense: Math.round(totalExpense),
              monthlyBudget: Math.round(budgetINR),
              budgetKey,
            },
          });
          console.log(`[Budget] Sent budget exceeded alert for user ${userId}`);
        } else {
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
              budgetKey,
            },
          });
          console.log(`[Budget] Sent ${threshold}% budget alert for user ${userId}`);
        }
      }
    }

    // 2. Category Budget Check
    if (category) {
      const categoryBudgetLimit = user.categoryBudgets && typeof user.categoryBudgets.get === "function"
        ? user.categoryBudgets.get(category)
        : (user.categoryBudgets ? user.categoryBudgets[category] : null);

      if (categoryBudgetLimit && categoryBudgetLimit > 0) {
        const categoryExpenses = monthlyExpenses.filter(item => item.category === category);
        const totalCategoryExpense = categoryExpenses.reduce((sum, item) => sum + (item.amountINR || item.amount || 0), 0);
        const categoryPercent = (totalCategoryExpense / categoryBudgetLimit) * 100;
        const categoryBudgetKey = getBudgetKey(categoryBudgetLimit);

        // Warning when crossing 80%
        if (categoryPercent >= 80 && (categoryPercent < 100 || categoryBudgetUpdated)) {
          const alreadySentCat80 = await Notification.findOne({
            user: userId,
            type: "budget",
            "data.category": category,
            "data.threshold": 80,
            createdAt: { $gte: startOfMonth, $lte: endOfMonth },
            ...budgetSnapshotMatchQuery(categoryBudgetKey, "budgetLimit", categoryBudgetLimit),
          });

          if (!alreadySentCat80) {
            await createNotification({
              user: userId,
              title: `⚠️ ${category} Budget Warning`,
              body: `You have spent 80% of your budget for "${category}" (₹${Math.round(totalCategoryExpense)} of ₹${Math.round(categoryBudgetLimit)}).`,
              type: "budget",
              data: {
                screen: "Budget",
                category,
                threshold: 80,
                totalExpense: Math.round(totalCategoryExpense),
                budgetLimit: Math.round(categoryBudgetLimit),
                budgetKey: categoryBudgetKey,
              },
            });
            console.log(`[Budget] Sent 80% category alert for ${category} to user ${userId}`);
          }
        }

        if (categoryPercent >= 100) {
          const alreadySentCat100 = await Notification.findOne({
            user: userId,
            type: "budget",
            "data.category": category,
            "data.threshold": 100,
            createdAt: { $gte: startOfMonth, $lte: endOfMonth },
            ...budgetSnapshotMatchQuery(categoryBudgetKey, "budgetLimit", categoryBudgetLimit),
          });

          if (!alreadySentCat100) {
            await createNotification({
              user: userId,
              title: `${category} Budget Reached`,
              body: `You have reached 100% of your budget for "${category}" (${Math.round(totalCategoryExpense)} of ${Math.round(categoryBudgetLimit)}).`,
              type: "budget",
              data: {
                screen: "Budget",
                category,
                threshold: 100,
                totalExpense: Math.round(totalCategoryExpense),
                budgetLimit: Math.round(categoryBudgetLimit),
                budgetKey: categoryBudgetKey,
              },
            });
          }
        }

        // Exceeded when crossing 100%
        if (categoryPercent > 100) {
          const alreadySentCatExceeded = await Notification.findOne({
            user: userId,
            type: "budget",
            "data.category": category,
            "data.threshold": "exceeded",
            createdAt: { $gte: startOfMonth, $lte: endOfMonth },
            ...budgetSnapshotMatchQuery(categoryBudgetKey, "budgetLimit", categoryBudgetLimit),
          });

          if (!alreadySentCatExceeded) {
            const excess = Math.round(totalCategoryExpense - categoryBudgetLimit);
            await createNotification({
              user: userId,
              title: `🚨 ${category} Budget Exceeded!`,
              body: `Your expenses for "${category}" have exceeded your budget by ₹${excess}. Total spent: ₹${Math.round(totalCategoryExpense)} / ₹${Math.round(categoryBudgetLimit)}.`,
              type: "budget",
              data: {
                screen: "Budget",
                category,
                threshold: "exceeded",
                excess,
                totalExpense: Math.round(totalCategoryExpense),
                budgetLimit: Math.round(categoryBudgetLimit),
                budgetKey: categoryBudgetKey,
              },
            });
            console.log(`[Budget] Sent category exceeded alert for ${category} to user ${userId}`);
          }
        }
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

  // Run budget threshold check asynchronously after sync
  setImmediate(async () => {
    try {
      await checkBudgetLimitsAndNotify(userId, null, 0, true);
    } catch (notificationError) {
      console.error("[Sync] Failed to trigger budget notification after sync:", notificationError);
    }
  });

  return results;
};


module.exports = {
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  syncTransactions,
  checkBudgetLimitsAndNotify,
};
