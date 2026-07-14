const ai = require("../../config/gemini");
const buildFinanceContext = require("./context");
const ChatMessage = require("./model");
const CHATBOT_PROMPT = require("./prompt");

const sendMessage = async (userId, message) => {
  // Save user's message
  await ChatMessage.create({
    user: userId,
    role: "user",
    message,
  });

  // Get recent chat history
  const history = await ChatMessage.find({
    
    user: userId,
  })
    .sort({ createdAt: -1 })
    .limit(20);
    const finance = await buildFinanceContext(userId);
const financeData = `
USER

Name: ${finance.user.fullName}

Currency: ${finance.user.currency}

Monthly Budget: ₹${finance.user.monthlyBudget}

Income: ₹${finance.income}

Expense: ₹${finance.expense}

Remaining Budget: ₹${finance.remainingBudget}

Recent Transactions

${finance.transactions
  .map(
    (t) =>
      `${t.type} | ₹${t.amount} | ${t.category} | ${t.description}`
  )
  .join("\n")}
`;
  // Reverse to oldest → newest
  history.reverse();

  // Build conversation
  let conversation = "";

  history.forEach(chat => {
    conversation += `${chat.role}: ${chat.message}\n`;
  });

  // Build prompt
  const prompt = `
${CHATBOT_PROMPT}

Previous Conversation:

${conversation}

Current User Message:

${message}
`;

  // Ask Gemini
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
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