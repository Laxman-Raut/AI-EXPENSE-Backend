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

const getJarsCtrl = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { status } = req.query;
    const result = await getSavingsJarsService(userId, status);

    return res.status(200).json({
      success: true,
      data: result.jars,
      summary: result.summary,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getJarByIdCtrl = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const data = await getJarByIdService(id, userId);

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

const createJarCtrl = async (req, res) => {
  try {
    const userId = req.user.userId;
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

const updateJarCtrl = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const data = await updateJarService(id, userId, req.body);

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

const deleteJarCtrl = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    await deleteJarService(id, userId);

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

const depositCtrl = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { amount, notes } = req.body;
    const data = await depositToJarService(id, userId, amount, notes);

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

const withdrawCtrl = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { amount, notes } = req.body;
    const data = await withdrawFromJarService(id, userId, amount, notes);

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

const transferCtrl = async (req, res) => {
  try {
    const userId = req.user.userId;
    const result = await transferMoneyService(userId, req.body);

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

const getAISuggestionsCtrl = async (req, res) => {
  try {
    const userId = req.user.userId;
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

module.exports = {
  getJarsCtrl,
  getJarByIdCtrl,
  createJarCtrl,
  updateJarCtrl,
  deleteJarCtrl,
  depositCtrl,
  withdrawCtrl,
  transferCtrl,
  getAISuggestionsCtrl,
};
