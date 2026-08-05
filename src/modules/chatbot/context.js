const Transaction = require("../transaction/model");
const User = require("../auth/model");
const Bank = require("../bank/model");
const RecurringTransaction = require("../recurringTransaction/model");

const buildFinanceContext = async (userId) => {
  const user = await User.findById(userId);

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  // 1. Fetch linked bank accounts
  const bankAccounts = await Bank.find({ user: userId }).sort({ isPrimary: -1, createdAt: -1 });

  // 2. Fetch current month transactions (populating bankAccount)
  const monthlyTransactions = await Transaction.find({
    user: userId,
    $or: [
      { transactionDate: { $gte: startOfMonth, $lte: endOfMonth } },
      { transactionDate: { $exists: false }, createdAt: { $gte: startOfMonth, $lte: endOfMonth } },
    ],
  }).populate("bankAccount");

  let income = 0;
  let expense = 0;
  const categorySpendMap = {};
  const bankSpendMap = {};

  monthlyTransactions.forEach((item) => {
    if (item.type === "income") {
      income += item.amount;
    } else {
      expense += item.amount;
      const cat = item.category || "Uncategorized";
      categorySpendMap[cat] = (categorySpendMap[cat] || 0) + item.amount;

      if (item.bankAccount) {
        const bId = typeof item.bankAccount === "object" ? item.bankAccount._id.toString() : item.bankAccount.toString();
        bankSpendMap[bId] = (bankSpendMap[bId] || 0) + item.amount;
      }
    }
  });

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

  // 5. Fetch Active Recurring Transactions & Subscriptions
  const recurringTransactions = await RecurringTransaction.find({
    user: userId,
    status: "active",
  }).sort({ nextExecutionDate: 1 });

  // 6. Fetch 20 most recent transactions overall (populating bankAccount)
  const transactions = await Transaction.find({
    user: userId,
  })
    .populate("bankAccount")
    .sort({ transactionDate: -1 })
    .limit(20);

  const monthlyBudget = user ? user.monthlyBudget : 0;

  return {
    user: {
      fullName: user?.fullName || "User",
      currency: user?.currency || "INR",
      monthlyBudget,
      subscription: user?.subscription || { plan: "free", status: "inactive" },
      aiUsage: user?.aiUsage || {},
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
    remainingBudget: monthlyBudget - expense,
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
    transactions: transactions.map((t) => {
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
        amount: t.amount,
        category: t.category,
        description: t.description,
        date: t.transactionDate ? t.transactionDate.toISOString().split("T")[0] : "N/A",
        paymentMethod: t.paymentMethod,
        bankAccountName: bankName,
      };
    }),
  };
};

module.exports = buildFinanceContext;