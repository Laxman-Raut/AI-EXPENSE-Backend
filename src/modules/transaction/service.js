const Transaction = require("./model");
// Create Transaction
const createTransaction = async (transactionData, userId) => {
  return await Transaction.create({
    ...transactionData,
    user: userId,
  });
};

// Get All Transactions
const getTransactions = async (userId) => {
  return await Transaction.find({ user: userId }).sort({
    transactionDate: -1,
  });
};

const getTransactionById = async (id, userId) => {
  const transaction = await Transaction.findOne({
    _id: id,
    user: userId,
  });

  if (!transaction) {
    throw new Error("Transaction not found");
  }

  return transaction;
};
const updateTransaction = async (id, userId, updateData) => {
  const transaction = await Transaction.findOneAndUpdate(
    { _id: id, user: userId },
    updateData,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!transaction) {
    throw new Error("Transaction not found");
  }

  return transaction;
};

const deleteTransaction = async (id, userId) => {
  const transaction = await Transaction.findOneAndDelete({
    _id: id,
    user: userId,
  });

  if (!transaction) {
    throw new Error("Transaction not found");
  }

  return transaction;
};


module.exports = {
  createTransaction,
  getTransactions,
   getTransactionById,
   updateTransaction,
   deleteTransaction,
};