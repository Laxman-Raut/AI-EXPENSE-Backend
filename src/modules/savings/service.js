const {
  getJarsRepo,
  getJarByIdRepo,
  createJarRepo,
  updateJarRepo,
  deleteJarRepo,
  depositToJarRepo,
  withdrawFromJarRepo,
  transferBetweenJarsRepo,
} = require("./repository");

const getSavingsJarsService = async (userId, status) => {
  const jars = await getJarsRepo(userId, status);
  let totalSavings = 0;
  let totalTarget = 0;

  jars.forEach((j) => {
    totalSavings += j.currentAmount || 0;
    totalTarget += j.targetAmount || 0;
  });

  return {
    summary: {
      totalSavings,
      totalTarget,
      activeJarsCount: jars.filter((j) => j.status === "active").length,
      completedJarsCount: jars.filter((j) => j.status === "completed").length,
    },
    jars,
  };
};

const getJarByIdService = async (id, userId) => {
  const jar = await getJarByIdRepo(id, userId);
  if (!jar) throw new Error("Savings jar not found");
  return jar;
};

const createJarService = async (userId, data) => {
  if (!data.name || !data.name.trim()) {
    throw new Error("Jar name is required");
  }
  if (!data.targetAmount || Number(data.targetAmount) <= 0) {
    throw new Error("Target amount must be greater than 0");
  }

  return await createJarRepo(userId, data);
};

const updateJarService = async (id, userId, data) => {
  const updated = await updateJarRepo(id, userId, data);
  if (!updated) throw new Error("Savings jar not found or access denied");
  return updated;
};

const deleteJarService = async (id, userId) => {
  const deleted = await deleteJarRepo(id, userId);
  if (!deleted) throw new Error("Savings jar not found or access denied");
  return deleted;
};

const depositToJarService = async (id, userId, amount, notes) => {
  return await depositToJarRepo(id, userId, amount, notes);
};

const withdrawFromJarService = async (id, userId, amount, notes) => {
  return await withdrawFromJarRepo(id, userId, amount, notes);
};

const transferMoneyService = async (userId, payload) => {
  const { fromJarId, toJarId, amount, notes } = payload;
  if (!fromJarId || !toJarId) {
    throw new Error("Source and destination jar IDs are required");
  }
  if (fromJarId === toJarId) {
    throw new Error("Source and destination jars must be different");
  }
  return await transferBetweenJarsRepo(userId, fromJarId, toJarId, amount, notes);
};

const getAISuggestionsService = async (userId) => {
  return [
    {
      title: "50/30/20 Rule Fund",
      suggestedTarget: 10000,
      description: "Allocate 20% of monthly income automatically into a rainy day emergency jar.",
      icon: "shield-checkmark",
    },
    {
      title: "Festive Season Shopping",
      suggestedTarget: 25000,
      description: "Start saving ₹2,000 monthly to avoid credit card debt during Diwali & year-end sales.",
      icon: "gift-outline",
    },
  ];
};

module.exports = {
  getSavingsJarsService,
  getJarByIdService,
  createJarService,
  updateJarService,
  deleteJarService,
  depositToJarService,
  withdrawFromJarService,
  transferMoneyService,
  getAISuggestionsService,
};
