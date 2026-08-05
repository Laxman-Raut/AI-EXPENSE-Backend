const SavingsJar = require("./model");
const User = require("../auth/model");
const subscriptionService = require("../subscription/service");

/**
 * Get all Savings Jars for a user with overall summary statistics
 */
const getJars = async (userId, statusFilter = null) => {
  const query = { user: userId };
  if (statusFilter && ["active", "completed", "archived"].includes(statusFilter)) {
    query.status = statusFilter;
  }

  const allJars = await SavingsJar.find({ user: userId }).sort({ updatedAt: -1 });

  const activeJarsCount = allJars.filter((j) => j.status === "active").length;
  const completedJarsCount = allJars.filter((j) => j.status === "completed").length;
  const archivedJarsCount = allJars.filter((j) => j.status === "archived").length;

  const totalSavings = allJars
    .filter((j) => j.status !== "archived")
    .reduce((sum, j) => sum + (j.currentAmount || 0), 0);

  // Filter jars if statusFilter was provided
  const jars = statusFilter ? allJars.filter((j) => j.status === statusFilter) : allJars;

  // Extract and aggregate recent transactions across all user jars
  const recentTransactions = [];
  allJars.forEach((jar) => {
    (jar.transactions || []).forEach((t) => {
      recentTransactions.push({
        _id: t._id,
        jarId: jar._id,
        jarName: jar.name,
        jarIcon: jar.icon,
        jarColor: jar.color,
        amount: t.amount,
        type: t.type,
        notes: t.notes,
        createdAt: t.createdAt,
      });
    });
  });

  recentTransactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return {
    jars,
    summary: {
      totalSavings,
      activeJarsCount,
      completedJarsCount,
      archivedJarsCount,
      totalJarsCount: allJars.length,
      recentTransactions: recentTransactions.slice(0, 15),
    },
  };
};

/**
 * Get a single Savings Jar by ID
 */
const getJarById = async (userId, jarId) => {
  const jar = await SavingsJar.findOne({ _id: jarId, user: userId });
  if (!jar) {
    const error = new Error("Savings Jar not found");
    error.statusCode = 404;
    throw error;
  }
  return jar;
};

/**
 * Create a new Savings Jar (with Free vs Premium tier enforcement)
 */
const createJar = async (userId, data) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  // Check subscription tier
  const isPremium = await subscriptionService.getSubscriptionStatus(userId);

  if (!isPremium) {
    // Free users can create a maximum of 3 savings jars
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

  const jar = new SavingsJar({
    user: userId,
    name: data.name,
    icon: data.icon || "🏆",
    color: data.color || "#4C6EF5",
    targetAmount: data.targetAmount ? Number(data.targetAmount) : null,
    notes: data.notes || "",
    currentAmount: 0,
    status: "active",
  });

  jar.updateStatusBasedOnTarget();
  await jar.save();
  return jar;
};

/**
 * Update an existing Savings Jar
 */
const updateJar = async (userId, jarId, data) => {
  const jar = await getJarById(userId, jarId);

  if (data.name !== undefined) jar.name = data.name;
  if (data.icon !== undefined) jar.icon = data.icon;
  if (data.color !== undefined) jar.color = data.color;
  if (data.targetAmount !== undefined) {
    jar.targetAmount = data.targetAmount ? Number(data.targetAmount) : null;
  }
  if (data.notes !== undefined) jar.notes = data.notes;
  if (data.status !== undefined) jar.status = data.status;

  jar.updateStatusBasedOnTarget();
  await jar.save();
  return jar;
};

/**
 * Delete a Savings Jar
 */
const deleteJar = async (userId, jarId) => {
  const jar = await getJarById(userId, jarId);
  await SavingsJar.deleteOne({ _id: jarId, user: userId });
  return { success: true, message: "Savings Jar deleted successfully" };
};

/**
 * Deposit funds into a Savings Jar
 */
const deposit = async (userId, jarId, amount, notes = "") => {
  const jar = await getJarById(userId, jarId);

  const depositAmount = Number(amount);
  if (isNaN(depositAmount) || depositAmount <= 0) {
    const error = new Error("Deposit amount must be greater than 0");
    error.statusCode = 400;
    throw error;
  }

  jar.currentAmount += depositAmount;
  jar.transactions.push({
    amount: depositAmount,
    type: "deposit",
    notes: notes || "Deposit into jar",
    createdAt: new Date(),
  });

  jar.updateStatusBasedOnTarget();
  await jar.save();
  return jar;
};

/**
 * Withdraw funds from a Savings Jar
 */
const withdraw = async (userId, jarId, amount, notes = "") => {
  const jar = await getJarById(userId, jarId);

  const withdrawAmount = Number(amount);
  if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
    const error = new Error("Withdraw amount must be greater than 0");
    error.statusCode = 400;
    throw error;
  }

  if (withdrawAmount > jar.currentAmount) {
    const error = new Error(
      `Insufficient funds in "${jar.name}". Current saved balance is ₹${jar.currentAmount.toFixed(2)}`
    );
    error.statusCode = 400;
    throw error;
  }

  jar.currentAmount -= withdrawAmount;
  jar.transactions.push({
    amount: withdrawAmount,
    type: "withdraw",
    notes: notes || "Withdrawal from jar",
    createdAt: new Date(),
  });

  jar.updateStatusBasedOnTarget();
  await jar.save();
  return jar;
};

/**
 * Transfer funds between two Savings Jars owned by the user
 */
const transfer = async (userId, fromJarId, toJarId, amount, notes = "") => {
  if (fromJarId === toJarId) {
    const error = new Error("Source and destination savings jars must be different");
    error.statusCode = 400;
    throw error;
  }

  const transferAmount = Number(amount);
  if (isNaN(transferAmount) || transferAmount <= 0) {
    const error = new Error("Transfer amount must be greater than 0");
    error.statusCode = 400;
    throw error;
  }

  const fromJar = await getJarById(userId, fromJarId);
  const toJar = await getJarById(userId, toJarId);

  if (transferAmount > fromJar.currentAmount) {
    const error = new Error(
      `Insufficient funds in "${fromJar.name}". Current balance is ₹${fromJar.currentAmount.toFixed(2)}`
    );
    error.statusCode = 400;
    throw error;
  }

  // Deduct from source jar
  fromJar.currentAmount -= transferAmount;
  fromJar.transactions.push({
    amount: transferAmount,
    type: "transfer_out",
    toJar: toJar._id,
    notes: notes || `Transferred to ${toJar.name}`,
    createdAt: new Date(),
  });
  fromJar.updateStatusBasedOnTarget();

  // Add to destination jar
  toJar.currentAmount += transferAmount;
  toJar.transactions.push({
    amount: transferAmount,
    type: "transfer_in",
    fromJar: fromJar._id,
    notes: notes || `Transferred from ${fromJar.name}`,
    createdAt: new Date(),
  });
  toJar.updateStatusBasedOnTarget();

  await fromJar.save();
  await toJar.save();

  return {
    fromJar,
    toJar,
    amount: transferAmount,
    message: `Transferred ₹${transferAmount.toFixed(2)} from ${fromJar.name} to ${toJar.name}`,
  };
};

/**
 * Generate AI Savings Suggestions
 */
const getAISuggestions = async (userId) => {
  const { jars, summary } = await getJars(userId, "active");

  const suggestions = [];

  if (jars.length === 0) {
    suggestions.push({
      id: "suggestion-1",
      icon: "💡",
      title: "Start an Emergency Fund",
      description:
        "Financial experts recommend keeping at least 3-6 months of expenses in an Emergency Fund.",
      actionText: "Create Emergency Jar",
      actionType: "CREATE_EMERGENCY",
    });
    suggestions.push({
      id: "suggestion-2",
      icon: "🎯",
      title: "Set Your First Goal",
      description:
        "Creating a target jar increases your savings consistency by up to 40%!",
      actionText: "Create Custom Jar",
      actionType: "CREATE_JAR",
    });
  } else {
    // Check for jars close to target
    jars.forEach((jar) => {
      if (jar.targetAmount && jar.targetAmount > 0) {
        const remaining = jar.targetAmount - jar.currentAmount;
        const percent = Math.round((jar.currentAmount / jar.targetAmount) * 100);

        if (percent >= 80 && percent < 100) {
          suggestions.push({
            id: `suggestion-progress-${jar._id}`,
            icon: "🔥",
            title: `Almost there! ${jar.name}`,
            description: `You're ${percent}% of the way to your ${jar.name} goal! Only ₹${remaining.toFixed(2)} left to reach target.`,
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
        icon: "⚡",
        title: "Automate Weekly Deposits",
        description:
          "Save ₹500 every week automatically to hit your targets 2x faster.",
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

  // Aliases
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
