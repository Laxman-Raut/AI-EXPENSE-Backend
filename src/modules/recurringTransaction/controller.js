const {
  createRecurringTransaction,
  getRecurringTransactions,
  getRecurringTransactionById,
  updateRecurringTransaction,
  deleteRecurringTransaction,
  toggleRecurringStatus,
} = require("./service");

// Add Recurring Transaction
const addRecurring = async (req, res) => {
  try {
    const recurring = await createRecurringTransaction(req.body, req.user.userId);
    res.status(201).json({
      success: true,
      message: "Recurring transaction added successfully",
      data: recurring,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Get All Recurring Transactions
const getAllRecurring = async (req, res) => {
  try {
    const recurringList = await getRecurringTransactions(req.user.userId);
    res.status(200).json({
      success: true,
      data: recurringList,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Get Single Recurring Transaction
const getRecurring = async (req, res) => {
  try {
    const recurring = await getRecurringTransactionById(req.params.id, req.user.userId);
    res.status(200).json({
      success: true,
      data: recurring,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

// Edit Recurring Transaction
const editRecurring = async (req, res) => {
  try {
    const recurring = await updateRecurringTransaction(req.params.id, req.user.userId, req.body);
    res.status(200).json({
      success: true,
      message: "Recurring transaction updated successfully",
      data: recurring,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Remove Recurring Transaction
const removeRecurring = async (req, res) => {
  try {
    await deleteRecurringTransaction(req.params.id, req.user.userId);
    res.status(200).json({
      success: true,
      message: "Recurring transaction deleted successfully",
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

// Pause/Resume Status
const toggleStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const recurring = await toggleRecurringStatus(req.params.id, req.user.userId, status);
    res.status(200).json({
      success: true,
      message: `Recurring transaction ${status === "active" ? "resumed" : "paused"} successfully`,
      data: recurring,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  addRecurring,
  getAllRecurring,
  getRecurring,
  editRecurring,
  removeRecurring,
  toggleStatus,
};
