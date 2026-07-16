const RecurringTransaction = require("./model");

// Create Recurring Transaction
const createRecurringTransaction = async (data, userId) => {
  const startDate = new Date(data.startDate);
  
  // Set nextExecutionDate initially to the startDate
  const recurring = await RecurringTransaction.create({
    ...data,
    user: userId,
    nextExecutionDate: startDate,
  });

  return recurring;
};

// Get All Recurring Transactions
const getRecurringTransactions = async (userId) => {
  return await RecurringTransaction.find({ user: userId }).sort({ createdAt: -1 });
};

// Get Single Recurring Transaction
const getRecurringTransactionById = async (id, userId) => {
  const recurring = await RecurringTransaction.findOne({ _id: id, user: userId });
  if (!recurring) {
    throw new Error("Recurring transaction not found");
  }
  return recurring;
};

// Update Recurring Transaction
const updateRecurringTransaction = async (id, userId, updateData) => {
  const recurring = await RecurringTransaction.findOne({ _id: id, user: userId });
  if (!recurring) {
    throw new Error("Recurring transaction not found");
  }

  // If frequency or startDate changes, we might need to reset nextExecutionDate
  let recalculate = false;
  if (updateData.startDate && new Date(updateData.startDate).getTime() !== recurring.startDate.getTime()) {
    recalculate = true;
  }
  if (updateData.frequency && updateData.frequency !== recurring.frequency) {
    recalculate = true;
  }

  // Update fields
  Object.keys(updateData).forEach((key) => {
    recurring[key] = updateData[key];
  });

  if (recalculate) {
    recurring.nextExecutionDate = new Date(recurring.startDate);
  }

  await recurring.save();
  return recurring;
};

// Delete Recurring Transaction
const deleteRecurringTransaction = async (id, userId) => {
  const recurring = await RecurringTransaction.findOneAndDelete({ _id: id, user: userId });
  if (!recurring) {
    throw new Error("Recurring transaction not found");
  }
  return recurring;
};

// Toggle Pause/Resume Status
const toggleRecurringStatus = async (id, userId, status) => {
  if (status !== "active" && status !== "paused") {
    throw new Error("Invalid status. Must be active or paused");
  }

  const recurring = await RecurringTransaction.findOneAndUpdate(
    { _id: id, user: userId },
    { status },
    { new: true }
  );

  if (!recurring) {
    throw new Error("Recurring transaction not found");
  }

  return recurring;
};

module.exports = {
  createRecurringTransaction,
  getRecurringTransactions,
  getRecurringTransactionById,
  updateRecurringTransaction,
  deleteRecurringTransaction,
  toggleRecurringStatus,
};
