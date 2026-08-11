const RecurringTransaction = require("./model");
const User = require("../auth/model");
const currencyService = require("../currency/service");
const {
  normalizeCurrency,
  selectStoredAmount,
} = require("../financial/service");

const getUserCurrency = async (userId) => {
  const user = await User.findById(userId).lean();
  return normalizeCurrency(user?.currency || "INR");
};

const formatRecurring = (doc, targetCurrency) => ({
  ...doc,
  amount: selectStoredAmount(doc, targetCurrency),
  currency: targetCurrency,
});

const createRecurringTransaction = async (data, userId) => {
  const userCurrency = await getUserCurrency(userId);
  const snapshot = await currencyService.createCurrencySnapshot(data.amount, userCurrency);
  const startDate = new Date(data.startDate);

  const recurring = await RecurringTransaction.create({
    ...data,
    user: userId,
    currency: userCurrency,
    amount: Number(data.amount),
    originalAmount: Number(data.amount),
    originalCurrency: userCurrency,
    amountINR: snapshot.amountINR,
    amountUSD: snapshot.amountUSD,
    exchangeRate: snapshot.exchangeRate,
    exchangeRateTimestamp: snapshot.exchangeRateTimestamp,
    nextExecutionDate: startDate,
  });

  return recurring.toObject();
};

const getRecurringTransactions = async (userId) => {
  const targetCurrency = await getUserCurrency(userId);
  const recurringList = await RecurringTransaction.find({ user: userId }).sort({ createdAt: -1 }).lean();
  return recurringList.map((item) => formatRecurring(item, targetCurrency));
};

const getRecurringTransactionById = async (id, userId) => {
  const targetCurrency = await getUserCurrency(userId);
  const recurring = await RecurringTransaction.findOne({ _id: id, user: userId }).lean();
  if (!recurring) {
    throw new Error("Recurring transaction not found");
  }
  return formatRecurring(recurring, targetCurrency);
};

const updateRecurringTransaction = async (id, userId, updateData) => {
  const recurring = await RecurringTransaction.findOne({ _id: id, user: userId });
  if (!recurring) {
    throw new Error("Recurring transaction not found");
  }

  const userCurrency = await getUserCurrency(userId);
  let recalculate = false;

  if (updateData.startDate && new Date(updateData.startDate).getTime() !== recurring.startDate.getTime()) {
    recalculate = true;
  }
  if (updateData.frequency && updateData.frequency !== recurring.frequency) {
    recalculate = true;
  }

  if (updateData.amount !== undefined || updateData.currency !== undefined) {
    const nextAmount = Number(updateData.amount !== undefined ? updateData.amount : recurring.amount);
    const nextCurrency = normalizeCurrency(updateData.currency || recurring.currency || userCurrency);
    const snapshot = await currencyService.createCurrencySnapshot(nextAmount, nextCurrency);
    recurring.amount = nextAmount;
    recurring.currency = nextCurrency;
    recurring.originalAmount = nextAmount;
    recurring.originalCurrency = nextCurrency;
    recurring.amountINR = snapshot.amountINR;
    recurring.amountUSD = snapshot.amountUSD;
    recurring.exchangeRate = snapshot.exchangeRate;
    recurring.exchangeRateTimestamp = snapshot.exchangeRateTimestamp;
  }

  Object.keys(updateData).forEach((key) => {
    if (key !== "amount" && key !== "currency") {
      recurring[key] = updateData[key];
    }
  });

  if (recalculate) {
    recurring.nextExecutionDate = new Date(recurring.startDate);
  }

  await recurring.save();
  return recurring.toObject();
};

const deleteRecurringTransaction = async (id, userId) => {
  const recurring = await RecurringTransaction.findOneAndDelete({ _id: id, user: userId });
  if (!recurring) {
    throw new Error("Recurring transaction not found");
  }
  return recurring;
};

const toggleRecurringStatus = async (id, userId, status) => {
  if (status !== "active" && status !== "paused") {
    throw new Error("Invalid status. Must be active or paused");
  }

  const recurring = await RecurringTransaction.findOneAndUpdate(
    { _id: id, user: userId },
    { status },
    { new: true }
  ).lean();

  if (!recurring) {
    throw new Error("Recurring transaction not found");
  }

  const targetCurrency = await getUserCurrency(userId);
  return formatRecurring(recurring, targetCurrency);
};

module.exports = {
  createRecurringTransaction,
  getRecurringTransactions,
  getRecurringTransactionById,
  updateRecurringTransaction,
  deleteRecurringTransaction,
  toggleRecurringStatus,
};
