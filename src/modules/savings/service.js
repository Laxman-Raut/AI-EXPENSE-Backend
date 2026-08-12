const SavingsJar = require("./model");
const SavingsGoal = require("./goalModel");
const User = require("../auth/model");
const subscriptionService = require("../subscription/service");
const currencyService = require("../currency/service");
const {
  normalizeCurrency,
  selectStoredAmount,
} = require("../financial/service");

const getUserCurrency = async (userId) => {
  const user = await User.findById(userId).lean();
  return normalizeCurrency(user?.currency || "INR");
};

const formatJarForCurrency = (jar, targetCurrency) => {
  const currentAmount = selectStoredAmount(
    {
      originalAmount: jar.currentAmount,
      originalCurrency: jar.originalCurrency || targetCurrency,
      exchangeRate: jar.exchangeRate,
      amountINR: jar.currentAmountINR,
      amountUSD: jar.currentAmountUSD,
      currentAmountINR: jar.currentAmountINR,
      currentAmountUSD: jar.currentAmountUSD,
    },
    targetCurrency
  );
  const targetAmount = jar.targetAmount !== null && jar.targetAmount !== undefined
    ? selectStoredAmount(
        {
          originalAmount: jar.targetAmount,
          originalCurrency: jar.originalCurrency || targetCurrency,
          exchangeRate: jar.exchangeRate,
          amountINR: jar.targetAmountINR,
          amountUSD: jar.targetAmountUSD,
          targetAmountINR: jar.targetAmountINR,
          targetAmountUSD: jar.targetAmountUSD,
        },
        targetCurrency
      )
    : null;

  const transactions = (jar.transactions || []).map((t) => ({
    ...t,
    amount: selectStoredAmount(t, targetCurrency),
    currency: targetCurrency,
  }));

  return {
    ...jar,
    currentAmount,
    targetAmount,
    currentAmountINR: jar.currentAmountINR !== null && jar.currentAmountINR !== undefined ? Number(jar.currentAmountINR) : null,
    currentAmountUSD: jar.currentAmountUSD !== null && jar.currentAmountUSD !== undefined ? Number(jar.currentAmountUSD) : null,
    targetAmountINR: jar.targetAmountINR !== null && jar.targetAmountINR !== undefined ? Number(jar.targetAmountINR) : null,
    targetAmountUSD: jar.targetAmountUSD !== null && jar.targetAmountUSD !== undefined ? Number(jar.targetAmountUSD) : null,
    originalAmount: jar.originalAmount !== null && jar.originalAmount !== undefined ? Number(jar.originalAmount) : null,
    originalCurrency: jar.originalCurrency || targetCurrency,
    exchangeRate: jar.exchangeRate !== null && jar.exchangeRate !== undefined ? Number(jar.exchangeRate) : null,
    exchangeRateTimestamp: jar.exchangeRateTimestamp || null,
    currency: targetCurrency,
    transactions,
  };
};

const getJarBalanceForCurrency = (jar, targetCurrency) => {
  return selectStoredAmount(jar, targetCurrency);
};

const getJars = async (userId, statusFilter = null) => {
  const targetCurrency = await getUserCurrency(userId);
  const allJars = await SavingsJar.find({ user: userId }).sort({ updatedAt: -1 }).lean();

  const activeJarsCount = allJars.filter((j) => j.status === "active").length;
  const completedJarsCount = allJars.filter((j) => j.status === "completed").length;
  const archivedJarsCount = allJars.filter((j) => j.status === "archived").length;

  const rawJars = statusFilter ? allJars.filter((j) => j.status === statusFilter) : allJars;
  const jars = rawJars.map((jar) => formatJarForCurrency(jar, targetCurrency));

  const totalSavings = Number(
    jars
      .filter((j) => j.status !== "archived")
      .reduce((sum, jar) => sum + getJarBalanceForCurrency(jar, targetCurrency), 0)
      .toFixed(2)
  );

  const recentTransactions = [];
  jars.forEach((jar) => {
    (jar.transactions || []).forEach((t) => {
      recentTransactions.push({
        _id: t._id,
        jarId: jar._id,
        jarName: jar.name,
        jarIcon: jar.icon,
        jarColor: jar.color,
        amount: t.amount,
        currency: targetCurrency,
        type: t.type,
        notes: t.notes,
        createdAt: t.createdAt,
      });
    });
  });

  recentTransactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const goalProgress = await getSavingsGoalProgress(userId, targetCurrency, allJars);

  return {
    jars,
    summary: {
      totalSavings,
      currency: targetCurrency,
      activeJarsCount,
      completedJarsCount,
      archivedJarsCount,
      totalJarsCount: allJars.length,
      recentTransactions: recentTransactions.slice(0, 15),
      periodicGoal: goalProgress,
    },
  };
};

const getJarById = async (userId, jarId) => {
  const jarDoc = await SavingsJar.findOne({ _id: jarId, user: userId }).lean();
  if (!jarDoc) {
    const error = new Error("Savings Jar not found");
    error.statusCode = 404;
    throw error;
  }

  const targetCurrency = await getUserCurrency(userId);
  return formatJarForCurrency(jarDoc, targetCurrency);
};

const createJar = async (userId, data) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  const isPremium = await subscriptionService.getSubscriptionStatus(userId);
  if (!isPremium) {
    const existingCount = await SavingsJar.countDocuments({
      user: userId,
      status: { $ne: "archived" },
    });

    if (existingCount >= 3) {
      const error = new Error(
        "Free plan is limited to 3 Savings Jars. Upgrade to Premium for unlimited jars!"
      );
      error.statusCode = 403;
      error.code = "UPGRADE_REQUIRED";
      throw error;
    }
  }

  const userCurrency = normalizeCurrency(user?.currency || "INR");
  let targetAmountINR = null;
  let targetAmountUSD = null;
  let exchangeRate = null;
  let exchangeRateTimestamp = null;

  if (data.targetAmount !== undefined && data.targetAmount !== null && data.targetAmount !== "") {
    const snapshot = await currencyService.createCurrencySnapshot(data.targetAmount, userCurrency);
    targetAmountINR = snapshot.amountINR;
    targetAmountUSD = snapshot.amountUSD;
    exchangeRate = snapshot.exchangeRate;
    exchangeRateTimestamp = snapshot.exchangeRateTimestamp;
  }

  const jar = await SavingsJar.create({
    user: userId,
    name: data.name,
    icon: data.icon || "trophy",
    color: data.color || "#4C6EF5",
    targetAmount: data.targetAmount !== undefined && data.targetAmount !== null && data.targetAmount !== "" ? Number(data.targetAmount) : null,
    targetAmountINR,
    targetAmountUSD,
    currentAmount: 0,
    currentAmountINR: 0,
    currentAmountUSD: 0,
    originalCurrency: userCurrency,
    exchangeRate,
    exchangeRateTimestamp,
    notes: data.notes || "",
    status: "active",
  });

  jar.updateStatusBasedOnTarget();
  await jar.save();
  return jar.toObject();
};

const updateJar = async (userId, jarId, data) => {
  const jar = await SavingsJar.findOne({ _id: jarId, user: userId });
  if (!jar) {
    const error = new Error("Savings Jar not found");
    error.statusCode = 404;
    throw error;
  }

  const userCurrency = await getUserCurrency(userId);

  if (data.name !== undefined) jar.name = data.name;
  if (data.icon !== undefined) jar.icon = data.icon;
  if (data.color !== undefined) jar.color = data.color;
  if (data.notes !== undefined) jar.notes = data.notes;
  if (data.status !== undefined) jar.status = data.status;

  if (data.targetAmount !== undefined) {
    if (data.targetAmount === null || data.targetAmount === "") {
      jar.targetAmount = null;
      jar.targetAmountINR = null;
      jar.targetAmountUSD = null;
    } else {
      const snapshot = await currencyService.createCurrencySnapshot(data.targetAmount, userCurrency);
      jar.targetAmount = Number(data.targetAmount);
      jar.targetAmountINR = snapshot.amountINR;
      jar.targetAmountUSD = snapshot.amountUSD;
      jar.exchangeRate = snapshot.exchangeRate;
      jar.exchangeRateTimestamp = snapshot.exchangeRateTimestamp;
    }
  }

  jar.updateStatusBasedOnTarget();
  await jar.save();
  return jar.toObject();
};

const deleteJar = async (userId, jarId) => {
  const jar = await SavingsJar.findOne({ _id: jarId, user: userId });
  if (!jar) {
    const error = new Error("Savings Jar not found");
    error.statusCode = 404;
    throw error;
  }

  await SavingsJar.deleteOne({ _id: jarId, user: userId });
  return { success: true, message: "Savings Jar deleted successfully" };
};

const deposit = async (userId, jarId, amount, notes = "") => {
  const jar = await SavingsJar.findOne({ _id: jarId, user: userId });
  if (!jar) {
    const error = new Error("Savings Jar not found");
    error.statusCode = 404;
    throw error;
  }

  const userCurrency = await getUserCurrency(userId);
  const depositAmount = Number(amount);
  if (Number.isNaN(depositAmount) || depositAmount <= 0) {
    const error = new Error("Deposit amount must be greater than 0");
    error.statusCode = 400;
    throw error;
  }

  const snapshot = await currencyService.createCurrencySnapshot(depositAmount, userCurrency);

  jar.currentAmountINR = Number((Number(jar.currentAmountINR || 0) + Number(snapshot.amountINR || 0)).toFixed(2));
  jar.currentAmountUSD = Number((Number(jar.currentAmountUSD || 0) + Number(snapshot.amountUSD || 0)).toFixed(2));
  jar.currentAmount = selectStoredAmount(
    {
      currentAmountINR: jar.currentAmountINR,
      currentAmountUSD: jar.currentAmountUSD,
      originalCurrency: userCurrency,
      amountINR: jar.currentAmountINR,
      amountUSD: jar.currentAmountUSD,
    },
    userCurrency
  );

  jar.transactions.push({
    amount: depositAmount,
    originalAmount: depositAmount,
    originalCurrency: userCurrency,
    amountINR: snapshot.amountINR,
    amountUSD: snapshot.amountUSD,
    exchangeRate: snapshot.exchangeRate,
    exchangeRateTimestamp: snapshot.exchangeRateTimestamp,
    type: "deposit",
    notes: notes || "Deposit into jar",
    createdAt: new Date(),
  });

  jar.updateStatusBasedOnTarget();
  await jar.save();
  return formatJarForCurrency(jar.toObject(), userCurrency);
};

const withdraw = async (userId, jarId, amount, notes = "") => {
  const jar = await SavingsJar.findOne({ _id: jarId, user: userId });
  if (!jar) {
    const error = new Error("Savings Jar not found");
    error.statusCode = 404;
    throw error;
  }

  const userCurrency = await getUserCurrency(userId);
  const withdrawAmount = Number(amount);
  if (Number.isNaN(withdrawAmount) || withdrawAmount <= 0) {
    const error = new Error("Withdraw amount must be greater than 0");
    error.statusCode = 400;
    throw error;
  }

  const availableBalance = selectStoredAmount(
    {
      currentAmountINR: jar.currentAmountINR,
      currentAmountUSD: jar.currentAmountUSD,
      originalCurrency: userCurrency,
      amountINR: jar.currentAmountINR,
      amountUSD: jar.currentAmountUSD,
    },
    userCurrency
  );

  if (withdrawAmount > availableBalance) {
    const error = new Error(
      `Insufficient funds in "${jar.name}". Current saved balance is ${availableBalance.toFixed(2)}`
    );
    error.statusCode = 400;
    throw error;
  }

  const snapshot = await currencyService.createCurrencySnapshot(withdrawAmount, userCurrency);

  jar.currentAmountINR = Math.max(Number((Number(jar.currentAmountINR || 0) - Number(snapshot.amountINR || 0)).toFixed(2)), 0);
  jar.currentAmountUSD = Math.max(Number((Number(jar.currentAmountUSD || 0) - Number(snapshot.amountUSD || 0)).toFixed(2)), 0);
  jar.currentAmount = selectStoredAmount(
    {
      currentAmountINR: jar.currentAmountINR,
      currentAmountUSD: jar.currentAmountUSD,
      originalCurrency: userCurrency,
      amountINR: jar.currentAmountINR,
      amountUSD: jar.currentAmountUSD,
    },
    userCurrency
  );

  jar.transactions.push({
    amount: withdrawAmount,
    originalAmount: withdrawAmount,
    originalCurrency: userCurrency,
    amountINR: snapshot.amountINR,
    amountUSD: snapshot.amountUSD,
    exchangeRate: snapshot.exchangeRate,
    exchangeRateTimestamp: snapshot.exchangeRateTimestamp,
    type: "withdraw",
    notes: notes || "Withdrawal from jar",
    createdAt: new Date(),
  });

  jar.updateStatusBasedOnTarget();
  await jar.save();
  return formatJarForCurrency(jar.toObject(), userCurrency);
};

const transfer = async (userId, fromJarId, toJarId, amount, notes = "") => {
  if (String(fromJarId) === String(toJarId)) {
    const error = new Error("Source and destination savings jars must be different");
    error.statusCode = 400;
    throw error;
  }

  const transferAmount = Number(amount);
  if (Number.isNaN(transferAmount) || transferAmount <= 0) {
    const error = new Error("Transfer amount must be greater than 0");
    error.statusCode = 400;
    throw error;
  }

  const userCurrency = await getUserCurrency(userId);
  const fromJar = await SavingsJar.findOne({ _id: fromJarId, user: userId });
  const toJar = await SavingsJar.findOne({ _id: toJarId, user: userId });

  if (!fromJar) {
    const error = new Error("Source savings jar not found");
    error.statusCode = 404;
    throw error;
  }
  if (!toJar) {
    const error = new Error("Destination savings jar not found");
    error.statusCode = 404;
    throw error;
  }

  const fromBalance = selectStoredAmount(
    {
      currentAmountINR: fromJar.currentAmountINR,
      currentAmountUSD: fromJar.currentAmountUSD,
      originalCurrency: userCurrency,
      amountINR: fromJar.currentAmountINR,
      amountUSD: fromJar.currentAmountUSD,
    },
    userCurrency
  );
  if (transferAmount > fromBalance) {
    const error = new Error(
      `Insufficient funds in "${fromJar.name}". Current balance is ${fromBalance.toFixed(2)}`
    );
    error.statusCode = 400;
    throw error;
  }

  const snapshot = await currencyService.createCurrencySnapshot(transferAmount, userCurrency);

  fromJar.currentAmountINR = Math.max(Number((Number(fromJar.currentAmountINR || 0) - Number(snapshot.amountINR || 0)).toFixed(2)), 0);
  fromJar.currentAmountUSD = Math.max(Number((Number(fromJar.currentAmountUSD || 0) - Number(snapshot.amountUSD || 0)).toFixed(2)), 0);
  fromJar.currentAmount = selectStoredAmount(
    {
      currentAmountINR: fromJar.currentAmountINR,
      currentAmountUSD: fromJar.currentAmountUSD,
      originalCurrency: userCurrency,
      amountINR: fromJar.currentAmountINR,
      amountUSD: fromJar.currentAmountUSD,
    },
    userCurrency
  );
  fromJar.transactions.push({
    amount: transferAmount,
    originalAmount: transferAmount,
    originalCurrency: userCurrency,
    amountINR: snapshot.amountINR,
    amountUSD: snapshot.amountUSD,
    exchangeRate: snapshot.exchangeRate,
    exchangeRateTimestamp: snapshot.exchangeRateTimestamp,
    type: "transfer_out",
    toJar: toJar._id,
    notes: notes || `Transferred to ${toJar.name}`,
    createdAt: new Date(),
  });
  fromJar.updateStatusBasedOnTarget();

  toJar.currentAmountINR = Number((Number(toJar.currentAmountINR || 0) + Number(snapshot.amountINR || 0)).toFixed(2));
  toJar.currentAmountUSD = Number((Number(toJar.currentAmountUSD || 0) + Number(snapshot.amountUSD || 0)).toFixed(2));
  toJar.currentAmount = selectStoredAmount(
    {
      currentAmountINR: toJar.currentAmountINR,
      currentAmountUSD: toJar.currentAmountUSD,
      originalCurrency: userCurrency,
      amountINR: toJar.currentAmountINR,
      amountUSD: toJar.currentAmountUSD,
    },
    userCurrency
  );
  toJar.transactions.push({
    amount: transferAmount,
    originalAmount: transferAmount,
    originalCurrency: userCurrency,
    amountINR: snapshot.amountINR,
    amountUSD: snapshot.amountUSD,
    exchangeRate: snapshot.exchangeRate,
    exchangeRateTimestamp: snapshot.exchangeRateTimestamp,
    type: "transfer_in",
    fromJar: fromJar._id,
    notes: notes || `Transferred from ${fromJar.name}`,
    createdAt: new Date(),
  });
  toJar.updateStatusBasedOnTarget();

  await fromJar.save();
  await toJar.save();

  return {
    fromJar: fromJar.toObject(),
    toJar: toJar.toObject(),
    amount: transferAmount,
    message: `Transferred ${transferAmount.toFixed(2)} from ${fromJar.name} to ${toJar.name}`,
  };
};

const getAISuggestions = async (userId) => {
  const { jars, summary } = await getJars(userId, "active");
  const suggestions = [];

  if (jars.length === 0) {
    suggestions.push({
      id: "suggestion-1",
      icon: "lightbulb",
      title: "Start an Emergency Fund",
      description:
        "Financial experts recommend keeping at least 3-6 months of expenses in an Emergency Fund.",
      actionText: "Create Emergency Jar",
      actionType: "CREATE_EMERGENCY",
    });
    suggestions.push({
      id: "suggestion-2",
      icon: "target",
      title: "Set Your First Goal",
      description:
        "Creating a target jar increases your savings consistency by up to 40%.",
      actionText: "Create Custom Jar",
      actionType: "CREATE_JAR",
    });
  } else {
    jars.forEach((jar) => {
      if (jar.targetAmount && jar.targetAmount > 0) {
        const remaining = jar.targetAmount - jar.currentAmount;
        const percent = Math.round((jar.currentAmount / jar.targetAmount) * 100);

        if (percent >= 80 && percent < 100) {
          suggestions.push({
            id: `suggestion-progress-${jar._id}`,
            icon: "flame",
            title: `Almost there! ${jar.name}`,
            description: `You're ${percent}% of the way to your ${jar.name} goal. Only ${remaining.toFixed(2)} left to reach target.`,
            actionText: "Top Up Jar",
            actionType: "DEPOSIT",
            jarId: jar._id,
          });
        }
      }
    });

    if (summary.totalSavings > 0) {
      suggestions.push({
        id: "suggestion-auto-save",
        icon: "zap",
        title: "Automate Weekly Deposits",
        description: "Save 500 every week automatically to hit your targets faster.",
        actionText: "Enable Auto Save",
        actionType: "AUTO_SAVE",
      });
    }
  }

  return {
    success: true,
    suggestions,
  };
};

const getPeriodDates = (period) => {
  const now = new Date();
  let startDate;
  let endDate;

  if (period === "weekly") {
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    startDate = new Date(now.setDate(diff));
    startDate.setHours(0, 0, 0, 0);
    endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 7);
  } else if (period === "yearly") {
    startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
    endDate = new Date(now.getFullYear() + 1, 0, 1, 0, 0, 0, 0);
  } else {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);
  }

  return { startDate, endDate };
};

const getSavingsGoalProgress = async (userId, preloadedCurrency = null, preloadedJars = null) => {
  const goalDoc = await SavingsGoal.findOne({ user: userId });
  if (!goalDoc) {
    return {
      hasGoal: false,
      goal: null,
    };
  }

  const { targetAmount, targetAmountINR, targetAmountUSD, originalAmount, originalCurrency, currency, exchangeRate, exchangeRateTimestamp, period, notes } = goalDoc;
  const { startDate, endDate } = getPeriodDates(period);
  const targetCurrency = preloadedCurrency || (await getUserCurrency(userId));

  const jars = preloadedJars || (await SavingsJar.find({ user: userId }).lean());
  let savedInPeriodINR = 0;
  let savedInPeriodUSD = 0;

  jars.forEach((jar) => {
    (jar.transactions || []).forEach((t) => {
      const txDate = t.createdAt ? new Date(t.createdAt) : null;
      if (t.type === "deposit" && txDate && txDate >= startDate && txDate < endDate) {
        savedInPeriodINR += selectStoredAmount(t, "INR");
        savedInPeriodUSD += selectStoredAmount(t, "USD");
      }
    });
  });

  const goalAmount = targetCurrency === "USD"
    ? Number(targetAmountUSD ?? 0)
    : Number(targetAmountINR ?? 0);
  const fallbackGoalAmount = Number(targetAmount || 0);
  const selectedGoalAmount = goalAmount > 0 ? goalAmount : fallbackGoalAmount;

  const savedInPeriod = targetCurrency === "USD" ? Number(savedInPeriodUSD.toFixed(2)) : Number(savedInPeriodINR.toFixed(2));
  const percentage = selectedGoalAmount > 0 ? Math.min(Math.round((savedInPeriod / selectedGoalAmount) * 100), 100) : 0;
  const remaining = Math.max(selectedGoalAmount - savedInPeriod, 0);
  const isGoalAchieved = savedInPeriod >= selectedGoalAmount;

  return {
    hasGoal: true,
    goal: {
      id: goalDoc._id,
      targetAmount: selectedGoalAmount,
      targetAmountINR: targetAmountINR !== null && targetAmountINR !== undefined ? Number(targetAmountINR) : null,
      targetAmountUSD: targetAmountUSD !== null && targetAmountUSD !== undefined ? Number(targetAmountUSD) : null,
      originalAmount: originalAmount !== null && originalAmount !== undefined ? Number(originalAmount) : null,
      originalCurrency: originalCurrency || targetCurrency,
      currency: targetCurrency,
      exchangeRate: exchangeRate !== null && exchangeRate !== undefined ? Number(exchangeRate) : null,
      exchangeRateTimestamp: exchangeRateTimestamp || null,
      period,
      notes,
      savedInPeriod,
      savedInPeriodINR: Number(savedInPeriodINR.toFixed(2)),
      savedInPeriodUSD: Number(savedInPeriodUSD.toFixed(2)),
      percentage,
      remaining,
      isGoalAchieved,
      startDate,
      endDate,
    },
  };
};

const setSavingsGoal = async (userId, data) => {
  const userCurrency = await getUserCurrency(userId);
  const amountNum = Number(data.targetAmount);
  const snapshot = await currencyService.createCurrencySnapshot(amountNum, userCurrency);
  const goal = await SavingsGoal.findOneAndUpdate(
    { user: userId },
    {
      targetAmount: amountNum,
      currency: userCurrency,
      originalAmount: amountNum,
      originalCurrency: userCurrency,
      targetAmountINR: snapshot.amountINR,
      targetAmountUSD: snapshot.amountUSD,
      exchangeRate: snapshot.exchangeRate,
      exchangeRateTimestamp: snapshot.exchangeRateTimestamp,
      period: data.period || "monthly",
      notes: data.notes || "",
    },
    { new: true, upsert: true }
  );

  return getSavingsGoalProgress(userId);
};

const deleteSavingsGoal = async (userId) => {
  await SavingsGoal.deleteOne({ user: userId });
  return { success: true, message: "Savings Goal removed" };
};

module.exports = {
  getJars,
  getJarById,
  createJar,
  updateJar,
  deleteJar,
  deposit,
  withdraw,
  transfer,
  getAISuggestions,
  getSavingsGoalProgress,
  setSavingsGoal,
  deleteSavingsGoal,
  getSavingsJarsService: getJars,
  getJarByIdService: getJarById,
  createJarService: createJar,
  updateJarService: updateJar,
  deleteJarService: deleteJar,
  depositToJarService: deposit,
  withdrawFromJarService: withdraw,
  transferMoneyService: transfer,
  getAISuggestionsService: getAISuggestions,
};
