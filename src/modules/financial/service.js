const currencyService = require("../currency/service");

const normalizeCurrency = (currency = "INR") => {
  const value = String(currency || "INR").toUpperCase().trim();
  if (value === "$") return "USD";
  if (value === "₹" || value === "RUPEES" || value.includes("INR")) return "INR";
  if (value === "USD" || value.includes("USD")) return "USD";
  return value || "INR";
};

const selectStoredAmount = (record = {}, targetCurrency = "INR") => {
  const currency = normalizeCurrency(targetCurrency);
  const isUsd = currency === "USD";

  if (isUsd) {
    if (record.amountUSD !== null && record.amountUSD !== undefined) return Number(record.amountUSD) || 0;
    if (record.currentAmountUSD !== null && record.currentAmountUSD !== undefined) return Number(record.currentAmountUSD) || 0;
    if (record.targetAmountUSD !== null && record.targetAmountUSD !== undefined) return Number(record.targetAmountUSD) || 0;
    if (record.monthlyBudgetUSD !== null && record.monthlyBudgetUSD !== undefined) return Number(record.monthlyBudgetUSD) || 0;
  } else {
    if (record.amountINR !== null && record.amountINR !== undefined) return Number(record.amountINR) || 0;
    if (record.currentAmountINR !== null && record.currentAmountINR !== undefined) return Number(record.currentAmountINR) || 0;
    if (record.targetAmountINR !== null && record.targetAmountINR !== undefined) return Number(record.targetAmountINR) || 0;
    if (record.monthlyBudgetINR !== null && record.monthlyBudgetINR !== undefined) return Number(record.monthlyBudgetINR) || 0;
  }

  const originalCurrency = normalizeCurrency(record.originalCurrency || record.currency || currency);
  const originalAmount = Number(
    record.originalAmount !== null && record.originalAmount !== undefined
      ? record.originalAmount
      : record.amount || 0
  );
  if (!originalAmount) return 0;

  if (originalCurrency === currency) {
    return Number(originalAmount.toFixed(2));
  }

  const exchangeRate = Number(record.exchangeRate || 0);
  if (exchangeRate > 0) {
    if (originalCurrency === "USD" && currency === "INR") {
      return Number((originalAmount * exchangeRate).toFixed(2));
    }
    if (originalCurrency === "INR" && currency === "USD") {
      return Number((originalAmount / exchangeRate).toFixed(2));
    }
  }

  return Number(originalAmount.toFixed(2));
};

const hydrateTransaction = (tx, targetCurrency = "INR") => {
  const normalized = normalizeCurrency(targetCurrency);
  const amount = selectStoredAmount(tx, normalized);
  return {
    ...tx,
    amount,
    currency: normalized,
  };
};

const hydrateSavingsJar = (jar, targetCurrency = "INR") => {
  const normalized = normalizeCurrency(targetCurrency);
  const currentAmount = selectStoredAmount(jar, normalized);
  const targetAmount = selectStoredAmount(jar, normalized);

  return {
    ...jar,
    currentAmount,
    targetAmount: jar.targetAmount !== null && jar.targetAmount !== undefined ? selectStoredAmount(jar, normalized) : null,
    currentAmountINR: jar.currentAmountINR !== null && jar.currentAmountINR !== undefined
      ? Number(jar.currentAmountINR)
      : (normalized === "INR" ? currentAmount : null),
    currentAmountUSD: jar.currentAmountUSD !== null && jar.currentAmountUSD !== undefined
      ? Number(jar.currentAmountUSD)
      : (normalized === "USD" ? currentAmount : null),
    targetAmountINR: jar.targetAmountINR !== null && jar.targetAmountINR !== undefined
      ? Number(jar.targetAmountINR)
      : null,
    targetAmountUSD: jar.targetAmountUSD !== null && jar.targetAmountUSD !== undefined
      ? Number(jar.targetAmountUSD)
      : null,
    currency: normalized,
  };
};

const aggregateTransactions = (transactions = [], targetCurrency = "INR") => {
  const normalized = normalizeCurrency(targetCurrency);
  let totalIncome = 0;
  let totalExpense = 0;
  let monthlyIncome = 0;
  let monthlyExpense = 0;
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  for (const tx of transactions) {
    const amount = selectStoredAmount(tx, normalized);
    if (tx.type === "income") totalIncome += amount;
    if (tx.type === "expense") totalExpense += amount;

    const txDate = tx.transactionDate ? new Date(tx.transactionDate) : new Date(tx.createdAt || Date.now());
    if (txDate >= startOfMonth && txDate <= endOfMonth) {
      if (tx.type === "income") monthlyIncome += amount;
      if (tx.type === "expense") monthlyExpense += amount;
    }
  }

  totalIncome = Number(totalIncome.toFixed(2));
  totalExpense = Number(totalExpense.toFixed(2));
  monthlyIncome = Number(monthlyIncome.toFixed(2));
  monthlyExpense = Number(monthlyExpense.toFixed(2));

  const totalSavings = Math.max(totalIncome - totalExpense, 0);
  const spentPercentage = totalIncome > 0 ? Math.min(Number(((totalExpense / totalIncome) * 100).toFixed(1)), 100) : 0;
  const savedPercentage = totalIncome > 0 ? Math.max(Number((((totalIncome - totalExpense) / totalIncome) * 100).toFixed(1)), 0) : 0;

  return {
    totalIncome,
    totalExpense,
    monthlyIncome,
    monthlyExpense,
    totalSavings,
    balance: Number((totalIncome - totalExpense).toFixed(2)),
    incomeSpentVsSaved: {
      totalIncome,
      totalExpense,
      totalSavings,
      spentPercentage,
      savedPercentage,
    },
  };
};

const aggregateSavingsGoalProgress = (jars = [], goalTargetAmount = 0, targetCurrency = "INR") => {
  const normalized = normalizeCurrency(targetCurrency);
  const savedInPeriod = jars.reduce((sum, jar) => sum + selectStoredAmount(jar, normalized), 0);
  const percentage = goalTargetAmount > 0 ? Math.min(Math.round((savedInPeriod / goalTargetAmount) * 100), 100) : 0;
  const remaining = Math.max(goalTargetAmount - savedInPeriod, 0);
  return {
    savedInPeriod,
    percentage,
    remaining,
    isGoalAchieved: savedInPeriod >= goalTargetAmount,
  };
};

const buildBudgetSnapshot = async (user, targetCurrency = "INR", spendAmount = 0) => {
  const normalized = normalizeCurrency(targetCurrency);
  const ratesMap = await currencyService.getRatesMap();
  const monthlyBudget = normalized === "USD"
    ? (user?.monthlyBudgetUSD && user.monthlyBudgetUSD > 0
      ? Number(user.monthlyBudgetUSD)
      : currencyService.convertAmountWithRates(user?.monthlyBudget || 0, "INR", "USD", ratesMap))
    : (user?.monthlyBudgetINR && user.monthlyBudgetINR > 0
      ? Number(user.monthlyBudgetINR)
      : Number(user?.monthlyBudget || 0));

  const budgetLimit = Number((monthlyBudget || 0).toFixed(2));
  const budgetRemaining = Math.max(Number((budgetLimit - spendAmount).toFixed(2)), 0);
  const utilizationPercentage = budgetLimit > 0 ? Number(((spendAmount / budgetLimit) * 100).toFixed(1)) : 0;

  return {
    budgetLimit,
    budgetSpent: Number(spendAmount.toFixed(2)),
    budgetRemaining,
    utilizationPercentage,
  };
};

module.exports = {
  normalizeCurrency,
  selectStoredAmount,
  hydrateTransaction,
  hydrateSavingsJar,
  aggregateTransactions,
  aggregateSavingsGoalProgress,
  buildBudgetSnapshot,
};
