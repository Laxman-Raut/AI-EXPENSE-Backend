const {
  createTransaction,
  getTransactions,
    getTransactionById,
     updateTransaction,
     deleteTransaction,

} = require("./service");

// Add Transaction
const addTransaction = async (req, res) => {
  try {
    const transaction = await createTransaction(
      req.body,
      req.user.userId
    );

    res.status(201).json({
      success: true,
      message: "Transaction added successfully",
      data: transaction,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Get All Transactions
const getAllTransactions = async (req, res) => {
  try {
    const transactions = await getTransactions(req.user.userId);

    res.status(200).json({
      success: true,
      data: transactions,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getTransaction = async (req, res) => {
  try {
    const transaction = await getTransactionById(
      req.params.id,
      req.user.userId
    );

    res.status(200).json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

const editTransaction = async (req, res) => {
  try {
    const transaction = await updateTransaction(
      req.params.id,
      req.user.userId,
      req.body
    );

    res.status(200).json({
      success: true,
      message: "Transaction updated successfully",
      data: transaction,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const removeTransaction = async (req, res) => {
  try {
    await deleteTransaction(req.params.id, req.user.userId);

    res.status(200).json({
      success: true,
      message: "Transaction deleted successfully",
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  addTransaction,
  getAllTransactions,
    getTransaction,
      editTransaction,
        removeTransaction,
};