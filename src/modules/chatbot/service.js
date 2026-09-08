const { getGeminiClient, getGeminiModel } = require("../../config/gemini");
const buildFinanceContext = require("./context");
const ChatMessage = require("./model");
const CHATBOT_PROMPT = require("./prompt");

const sendMessage = async (userId, message) => {
  // 1. Concurrently fetch recent chat history and financial context in parallel
  const [history, finance] = await Promise.all([
    ChatMessage.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(8)
      .lean(),
    buildFinanceContext(userId),
    ChatMessage.create({
      user: userId,
      role: "user",
      message,
    }),
  ]);

  // Increment user's chatbot usage count asynchronously without blocking
  const User = require("../auth/model");
  User.findByIdAndUpdate(userId, {
    $inc: { "aiUsage.chatbot.used": 1 },
  }).catch((err) => console.error("Failed to increment chatbot usage:", err.message));

  // Format Today's Activity
  const todayTransactionsFormatted = finance.today.transactions.length > 0
    ? finance.today.transactions
        .map((t) => `- [${t.type.toUpperCase()}] ₹${t.amount} | ${t.category} | ${t.description} (${t.paymentMethod})`)
        .join("\n")
    : "No transactions recorded yet today.";

  // Format Bank Accounts
  const bankAccountsFormatted = finance.bankAccounts && finance.bankAccounts.length > 0
    ? finance.bankAccounts
        .map(
          (b) =>
            `- ${b.bankName} (${b.accountNumber}) [${b.accountType}]${b.isPrimary ? " [PRIMARY]" : ""}: Month Spend ₹${b.monthSpend}`
        )
        .join("\n")
    : "No linked bank accounts.";

  // Format Category Budgets
  const catBudgetsFormatted = finance.categoryBudgets.length > 0
    ? finance.categoryBudgets
        .map(
          (cb) =>
            `- ${cb.category}: Limit ₹${cb.budgetLimit} | Spent ₹${cb.spent} (${cb.percentSpent}%) | Status: ${cb.status}`
        )
        .join("\n")
    : "No specific category budgets set.";

  // Format Top Categories
  const topCatsFormatted = finance.topCategories.length > 0
    ? finance.topCategories
        .map((tc) => `- ${tc.category}: ₹${tc.amount}`)
        .join("\n")
    : "No expense transactions recorded this month.";

  // Format Recurring Transactions
  const recurringFormatted = finance.recurringTransactions.length > 0
    ? finance.recurringTransactions
        .map(
          (rt) =>
            `- [${rt.type.toUpperCase()}] ${rt.description}: ₹${rt.amount} (${rt.frequency}) | Next Due: ${rt.nextExecutionDate} | Method: ${rt.paymentMethod}`
        )
        .join("\n")
    : "No active recurring transactions or subscriptions.";

  // Format Recent Transactions
  const recentTransactionsFormatted = finance.transactions.length > 0
    ? finance.transactions
        .map(
          (t) =>
            `- ${t.date} | [${t.type.toUpperCase()}] ₹${t.amount} | ${t.category} | ${t.description} (${t.paymentMethod}${t.bankAccountName ? ' • ' + t.bankAccountName : ''})`
        )
        .join("\n")
    : "No recent transactions found.";

  const financeData = `
====================================
USER PROFILE & SUBSCRIPTION
====================================
Name: ${finance.user.fullName}
Currency: ${finance.user.currency}
Subscription Plan: ${finance.user.subscription?.plan || "free"} (${finance.user.subscription?.status || "inactive"})

====================================
TODAY'S ACTIVITY (${finance.today.date})
====================================
Today's Total Expense: ₹${finance.today.expense}
Today's Total Income: ₹${finance.today.income}
Today's Transactions:
${todayTransactionsFormatted}

====================================
MONTHLY FINANCIAL SUMMARY
====================================
Monthly Overall Budget: ₹${finance.user.monthlyBudget}
Total Monthly Income: ₹${finance.income}
Total Monthly Expense: ₹${finance.expense}
Remaining Overall Budget: ₹${finance.remainingBudget}

====================================
LINKED BANK ACCOUNTS & MONTHLY SPEND
====================================
${bankAccountsFormatted}

====================================
CATEGORY-WISE BUDGET STATUS
====================================
${catBudgetsFormatted}

====================================
TOP SPENDING CATEGORIES THIS MONTH
====================================
${topCatsFormatted}

====================================
ACTIVE RECURRING TRANSACTIONS & SUBSCRIPTIONS
====================================
${recurringFormatted}

====================================
RECENT TRANSACTIONS LOG
====================================
${recentTransactionsFormatted}
`;

  // Reverse history to chronological order (oldest → newest)
  history.reverse();

  // Build conversation text
  let conversation = "";
  history.forEach((chat) => {
    conversation += `${chat.role}: ${chat.message}\n`;
  });

  // Build full prompt incorporating system prompt, financial context, and conversation
  const prompt = `
${CHATBOT_PROMPT}

User's Current Financial Data:
${financeData}

Previous Conversation History:
${conversation}

Current User Message:
${message}
`;

  // Use ultra-fast gemini-3.1-flash-lite for instant responses
  const client = await getGeminiClient();
  const modelName = await getGeminiModel("gemini-3.1-flash-lite");
  const response = await client.models.generateContent({
    model: modelName,
    contents: prompt,
  });

  const reply = response.text;

  // Save AI reply
  await ChatMessage.create({
    user: userId,
    role: "assistant",
    message: reply,
  });

  return reply;
};

// Get chat history
const getHistory = async (userId) => {
  return await ChatMessage.find({
    user: userId,
  }).sort({
    createdAt: 1,
  });
};

// Clear history
const clearHistory = async (userId) => {
  return await ChatMessage.deleteMany({
    user: userId,
  });
};

module.exports = {
  sendMessage,
  getHistory,
  clearHistory,
};