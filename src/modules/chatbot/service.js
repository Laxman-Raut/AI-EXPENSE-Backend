const ai = require("../../config/gemini");
const buildFinanceContext = require("./context");
const ChatMessage = require("./model");
const CHATBOT_PROMPT = require("./prompt");

const sendMessage = async (userId, message) => {
  // 1. Get recent chat history (before saving new message to avoid duplicating it)
  const history = await ChatMessage.find({
    user: userId,
  })
    .sort({ createdAt: -1 })
    .limit(20);

  // 2. Save user's message
  await ChatMessage.create({
    user: userId,
    role: "user",
    message,
  });

  // 3. Build rich financial context
  const finance = await buildFinanceContext(userId);

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
            `- ${t.date} | [${t.type.toUpperCase()}] ₹${t.amount} | ${t.category} | ${t.description} (${t.paymentMethod})`
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
MONTHLY FINANCIAL SUMMARY
====================================
Monthly Overall Budget: ₹${finance.user.monthlyBudget}
Total Monthly Income: ₹${finance.income}
Total Monthly Expense: ₹${finance.expense}
Remaining Overall Budget: ₹${finance.remainingBudget}

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

  // Ask Gemini using working model gemini-3.1-flash-lite
  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-lite",
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