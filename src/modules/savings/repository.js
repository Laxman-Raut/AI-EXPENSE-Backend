const SavingsJar = require("./savings.model");

const getJarsRepo = async (userId, status) => {
  const query = { user: userId };
  if (status) query.status = status;
  return await SavingsJar.find(query).sort({ createdAt: -1 });
};

const getJarByIdRepo = async (id, userId) => {
  return await SavingsJar.findOne({ _id: id, user: userId });
};

const createJarRepo = async (userId, data) => {
  const jar = new SavingsJar({
    user: userId,
    name: data.name,
    targetAmount: Number(data.targetAmount) || 0,
    currentAmount: Number(data.currentAmount) || 0,
    icon: data.icon || "trophy-outline",
    color: data.color || "#8A3FFC",
    targetDate: data.targetDate ? new Date(data.targetDate) : null,
    notes: data.notes || "",
  });

  if (jar.currentAmount >= jar.targetAmount && jar.targetAmount > 0) {
    jar.status = "completed";
  }

  return await jar.save();
};

const updateJarRepo = async (id, userId, data) => {
  const jar = await SavingsJar.findOne({ _id: id, user: userId });
  if (!jar) return null;

  if (data.name !== undefined) jar.name = data.name;
  if (data.targetAmount !== undefined) jar.targetAmount = Number(data.targetAmount);
  if (data.currentAmount !== undefined) jar.currentAmount = Number(data.currentAmount);
  if (data.icon !== undefined) jar.icon = data.icon;
  if (data.color !== undefined) jar.color = data.color;
  if (data.status !== undefined) jar.status = data.status;
  if (data.targetDate !== undefined) jar.targetDate = data.targetDate ? new Date(data.targetDate) : null;
  if (data.notes !== undefined) jar.notes = data.notes;

  if (jar.currentAmount >= jar.targetAmount && jar.status !== "archived") {
    jar.status = "completed";
  } else if (jar.currentAmount < jar.targetAmount && jar.status === "completed") {
    jar.status = "active";
  }

  return await jar.save();
};

const deleteJarRepo = async (id, userId) => {
  return await SavingsJar.findOneAndDelete({ _id: id, user: userId });
};

const depositToJarRepo = async (id, userId, amount, notes = "") => {
  const jar = await SavingsJar.findOne({ _id: id, user: userId });
  if (!jar) throw new Error("Savings jar not found");

  const depositAmt = Number(amount);
  if (isNaN(depositAmt) || depositAmt <= 0) {
    throw new Error("Deposit amount must be a positive number");
  }

  jar.currentAmount += depositAmt;
  jar.history.push({
    type: "deposit",
    amount: depositAmt,
    notes,
    date: new Date(),
  });

  if (jar.currentAmount >= jar.targetAmount) {
    jar.status = "completed";
  }

  return await jar.save();
};

const withdrawFromJarRepo = async (id, userId, amount, notes = "") => {
  const jar = await SavingsJar.findOne({ _id: id, user: userId });
  if (!jar) throw new Error("Savings jar not found");

  const withdrawAmt = Number(amount);
  if (isNaN(withdrawAmt) || withdrawAmt <= 0) {
    throw new Error("Withdraw amount must be a positive number");
  }

  if (withdrawAmt > jar.currentAmount) {
    throw new Error(`Insufficient funds in jar. Available balance: ${jar.currentAmount}`);
  }

  jar.currentAmount -= withdrawAmt;
  jar.history.push({
    type: "withdraw",
    amount: withdrawAmt,
    notes,
    date: new Date(),
  });

  if (jar.currentAmount < jar.targetAmount && jar.status === "completed") {
    jar.status = "active";
  }

  return await jar.save();
};

const transferBetweenJarsRepo = async (userId, fromJarId, toJarId, amount, notes = "") => {
  const transferAmt = Number(amount);
  if (isNaN(transferAmt) || transferAmt <= 0) {
    throw new Error("Transfer amount must be a positive number");
  }

  const fromJar = await SavingsJar.findOne({ _id: fromJarId, user: userId });
  if (!fromJar) throw new Error("Source savings jar not found");

  const toJar = await SavingsJar.findOne({ _id: toJarId, user: userId });
  if (!toJar) throw new Error("Destination savings jar not found");

  if (fromJar.currentAmount < transferAmt) {
    throw new Error(`Insufficient balance in source jar ${fromJar.name}. Available: ${fromJar.currentAmount}`);
  }

  fromJar.currentAmount -= transferAmt;
  fromJar.history.push({
    type: "transfer_out",
    amount: transferAmt,
    notes: notes || `Transferred to ${toJar.name}`,
    date: new Date(),
  });
  await fromJar.save();

  toJar.currentAmount += transferAmt;
  toJar.history.push({
    type: "transfer_in",
    amount: transferAmt,
    notes: notes || `Transferred from ${fromJar.name}`,
    date: new Date(),
  });
  if (toJar.currentAmount >= toJar.targetAmount) {
    toJar.status = "completed";
  }
  await toJar.save();

  return { fromJar, toJar };
};

module.exports = {
  getJarsRepo,
  getJarByIdRepo,
  createJarRepo,
  updateJarRepo,
  deleteJarRepo,
  depositToJarRepo,
  withdrawFromJarRepo,
  transferBetweenJarsRepo,
};
