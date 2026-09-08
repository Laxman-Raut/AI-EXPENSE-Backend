const Transaction = require("../transaction/model");
const User = require("../auth/model");
const Bank = require("../bank/model");
const RecurringTransaction = require("../recurringTransaction/model");
const {
  normalizeCurrency,
  selectStoredAmount,
  buildBudgetSnapshot,
} = require("../financial/service");

const buildFinanceContext = async (userId) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  // Fetch all DB queries concurrently to eliminate sequential network roundtrips
  const [user, bankAccounts, monthlyTransactions, recurringTransactions, recentTransactions] = await Promise.all([
    User.findById(userId).lean(),
    Bank.find({ user: userId }).sort({ isPrimary: -1, createdAt: -1 }).lean(),
    Transaction.find({
      user: userId,
      $or: [
        { transactionDate: { $gte: startOfMonth, $lte: endOfMonth } },
        { transactionDate: { $exists: false }, createdAt: { $gte: startOfMonth, $lte: endOfMonth } },
      ],
    }).populate("bankAccount").lean(),
    RecurringTransaction.find({
      user: userId,
      status: "active",
    }).sort({ nextExecutionDate: 1 }).lean(),
    Transaction.find({ user: userId })
      .populate("bankAccount")
      .sort({ transactionDate: -1, createdAt: -1 })
      .limit(15)
      .lean(),
  ]);

  let income = 0;
  let expense = 0;
  let todayIncome = 0;
  let todayExpense = 0;
  const todayTransactions = [];
  const categorySpendMap = {};
  const bankSpendMap = {};

  // Use currency-aware amount selection to match dashboard calculations
  const userCurrency = normalizeCurrency(user?.currency || "INR");

  monthlyTransactions.forEach((item) => {
    const amount = selectStoredAmount(item, userCurrency);
    const itemDate = item.transactionDate ? new Date(item.transactionDate) : new Date(item.createdAt);
    const isToday = itemDate >= startOfToday && itemDate <= endOfToday;

    if (item.type === "income") {
      income += amount;
      if (isToday) todayIncome += amount;
    } else {
      expense += amount;
      if (isToday) todayExpense += amount;
      const cat = item.category || "Uncategorized";
      categorySpendMap[cat] = (categorySpendMap[cat] || 0) + amount;

      if (item.bankAccount) {
        const bId = typeof item.bankAccount === "object" ? item.bankAccount._id.toString() : item.bankAccount.toString();
        bankSpendMap[bId] = (bankSpendMap[bId] || 0) + amount;
      }
    }

    if (isToday) {
      todayTransactions.push({
        type: item.type,
        amount,
        category: item.category || "General",
        description: item.description || "Expense",
        paymentMethod: item.paymentMethod || "UPI",
      });
    }
  });

  income = Number(income.toFixed(2));
  expense = Number(expense.toFixed(2));
  todayIncome = Number(todayIncome.toFixed(2));
  todayExpense = Number(todayExpense.toFixed(2));

  // 3. Build Category Budgets vs Category Spend Comparison
  const categoryBudgetsRaw = user?.categoryBudgets ? (user.categoryBudgets instanceof Map ? Object.fromEntries(user.categoryBudgets) : user.categoryBudgets) : {};
  const categoryBudgets = [];

  for (const [catName, budgetLimit] of Object.entries(categoryBudgetsRaw)) {
    if (budgetLimit > 0) {
      const spent = categorySpendMap[catName] || 0;
      const percent = Math.round((spent / budgetLimit) * 100);
      let status = "Under Budget";
      if (spent > budgetLimit) {
        status = "EXCEEDED";
      } else if (percent >= 80) {
        status = "WARNING (80%+ Used)";
      }

      categoryBudgets.push({
        category: catName,
        budgetLimit,
        spent,
        remaining: budgetLimit - spent,
        percentSpent: percent,
        status,
      });
    }
  }

  // 4. Top Spending Categories this month
  const topCategories = Object.entries(categorySpendMap)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  // 5. Build currency-aware budget snapshot (matches dashboard logic exactly)
  const budgetSnapshot = await buildBudgetSnapshot(user, userCurrency, expense);
  const monthlyBudget = budgetSnapshot.budgetLimit;

  return {
    user: {
      fullName: user?.fullName || "User",
      currency: userCurrency,
      monthlyBudget,
      subscription: user?.subscription || { plan: "free", status: "inactive" },
      aiUsage: user?.aiUsage || {},
    },
    today: {
      date: now.toISOString().split("T")[0],
      expense: todayExpense,
      income: todayIncome,
      transactions: todayTransactions,
    },
    bankAccounts: bankAccounts.map((b) => ({
      id: b._id.toString(),
      bankName: b.bankName,
      accountNumber: b.accountNumber ? `•••• ${b.accountNumber.slice(-4)}` : "N/A",
      accountType: b.accountType || "Savings",
      nickname: b.nickname || "",
      isPrimary: Boolean(b.isPrimary),
      monthSpend: bankSpendMap[b._id.toString()] || 0,
    })),
    income,
    expense,
    remainingBudget: budgetSnapshot.budgetRemaining,
    categoryBudgets,
    topCategories,
    recurringTransactions: recurringTransactions.map((rt) => ({
      description: rt.description,
      amount: rt.amount,
      type: rt.type,
      category: rt.category,
      frequency: rt.frequency,
      nextExecutionDate: rt.nextExecutionDate ? rt.nextExecutionDate.toISOString().split("T")[0] : "N/A",
      paymentMethod: rt.paymentMethod,
    })),
    transactions: recentTransactions.map((t) => {
      let bankName = "";
      if (t.bankAccount) {
        if (typeof t.bankAccount === "object") {
          bankName = t.bankAccount.bankName || t.bankAccount.nickname || "";
          if (t.bankAccount.accountNumber) {
            bankName += ` (••${t.bankAccount.accountNumber.slice(-4)})`;
          }
        } else if (typeof t.bankAccount === "string") {
          bankName = t.bankAccount;
        }
      }
      return {
        type: t.type,
        amount: selectStoredAmount(t, userCurrency),
        category: t.category,
        description: t.description,
        date: t.transactionDate ? new Date(t.transactionDate).toISOString().split("T")[0] : "N/A",
        paymentMethod: t.paymentMethod,
        bankAccountName: bankName,
      };
    }),
  };
};

module.exports = buildFinanceContext;