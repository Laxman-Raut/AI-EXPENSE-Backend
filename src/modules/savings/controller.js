const {
  getSavingsJarsService,
  getJarByIdService,
  createJarService,
  updateJarService,
  deleteJarService,
  depositToJarService,
  withdrawFromJarService,
  transferMoneyService,
  getAISuggestionsService,
} = require("./service");
const savingsService = require("./service");

const getJarsCtrl = async (req, res, next) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { status } = req.query;
    const result = await getSavingsJarsService(userId, status);

    return res.status(200).json({
      success: true,
      data: result.jars,
      summary: result.summary,
    });
  } catch (error) {
    if (next) return next(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getJarByIdCtrl = async (req, res, next) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { id } = req.params;
    const data = await getJarByIdService(userId, id);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

const createJarCtrl = async (req, res, next) => {
  try {
    const userId = req.user.userId || req.user.id;
    const data = await createJarService(userId, req.body);

    return res.status(201).json({
      success: true,
      message: "Savings jar created successfully",
      data,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const updateJarCtrl = async (req, res, next) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { id } = req.params;
    const data = await updateJarService(userId, id, req.body);

    return res.status(200).json({
      success: true,
      message: "Savings jar updated successfully",
      data,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteJarCtrl = async (req, res, next) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { id } = req.params;
    await deleteJarService(userId, id);

    return res.status(200).json({
      success: true,
      message: "Savings jar deleted successfully",
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const depositCtrl = async (req, res, next) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { id } = req.params;
    const { amount, notes } = req.body;
    const data = await depositToJarService(userId, id, amount, notes);

    return res.status(200).json({
      success: true,
      message: "Deposit successful",
      data,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const withdrawCtrl = async (req, res, next) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { id } = req.params;
    const { amount, notes } = req.body;
    const data = await withdrawFromJarService(userId, id, amount, notes);

    return res.status(200).json({
      success: true,
      message: "Withdrawal successful",
      data,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const transferCtrl = async (req, res, next) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { fromJarId, toJarId, amount, notes } = req.body;
    const result = await transferMoneyService(userId, fromJarId, toJarId, amount, notes);

    return res.status(200).json({
      success: true,
      message: "Transfer completed successfully",
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getAISuggestionsCtrl = async (req, res, next) => {
  try {
    const userId = req.user.userId || req.user.id;
    const suggestions = await getAISuggestionsService(userId);

    return res.status(200).json({
      success: true,
      data: suggestions,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getSavingsGoalCtrl = async (req, res, next) => {
  try {
    const userId = req.user.userId || req.user.id;
    const progress = await savingsService.getSavingsGoalProgress(userId);

    return res.status(200).json({
      success: true,
      data: progress,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const setSavingsGoalCtrl = async (req, res, next) => {
  try {
    const userId = req.user.userId || req.user.id;
    const result = await savingsService.setSavingsGoal(userId, req.body);

    return res.status(200).json({
      success: true,
      message: "Savings Goal saved successfully",
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteSavingsGoalCtrl = async (req, res, next) => {
  try {
    const userId = req.user.userId || req.user.id;
    const result = await savingsService.deleteSavingsGoal(userId);

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getJars: getJarsCtrl,
  getJarById: getJarByIdCtrl,
  createJar: createJarCtrl,
  updateJar: updateJarCtrl,
  deleteJar: deleteJarCtrl,
  deposit: depositCtrl,
  withdraw: withdrawCtrl,
  transfer: transferCtrl,
  getAISuggestions: getAISuggestionsCtrl,
  getSavingsGoal: getSavingsGoalCtrl,
  setSavingsGoal: setSavingsGoalCtrl,
  deleteSavingsGoal: deleteSavingsGoalCtrl,

  // Export aliases
  getJarsCtrl,
  getJarByIdCtrl,
  createJarCtrl,
  updateJarCtrl,
  deleteJarCtrl,
  depositCtrl,
  withdrawCtrl,
  transferCtrl,
  getAISuggestionsCtrl,
  getSavingsGoalCtrl,
  setSavingsGoalCtrl,
  deleteSavingsGoalCtrl,
};
