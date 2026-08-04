const bankService = require("./service");

/**
 * Create Bank Account
 */
const createBank = async (req, res) => {
  try {
    const result = await bankService.createBank(
      req.user._id,
      req.body
    );

    return res.status(result.statusCode).json(result);
  } catch (error) {
    console.error("Create Bank Controller Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

/**
 * Get All Bank Accounts
 */
const getBanks = async (req, res) => {
  try {
    const result = await bankService.getBanks(req.user._id);

    return res.status(result.statusCode).json(result);
  } catch (error) {
    console.error("Get Banks Controller Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

/**
 * Get Single Bank Account
 */
const getBankById = async (req, res) => {
  try {
    const result = await bankService.getBankById(
      req.user._id,
      req.params.id
    );

    return res.status(result.statusCode).json(result);
  } catch (error) {
    console.error("Get Bank Controller Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

/**
 * Update Bank Account
 */
const updateBank = async (req, res) => {
  try {
    const result = await bankService.updateBank(
      req.user._id,
      req.params.id,
      req.body
    );

    return res.status(result.statusCode).json(result);
  } catch (error) {
    console.error("Update Bank Controller Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

/**
 * Delete Bank Account
 */
const deleteBank = async (req, res) => {
  try {
    const result = await bankService.deleteBank(
      req.user._id,
      req.params.id
    );

    return res.status(result.statusCode).json(result);
  } catch (error) {
    console.error("Delete Bank Controller Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

/**
 * Set Primary Bank
 */
const setPrimaryBank = async (req, res) => {
  try {
    const result = await bankService.setPrimaryBank(
      req.user._id,
      req.params.id
    );

    return res.status(result.statusCode).json(result);
  } catch (error) {
    console.error("Set Primary Bank Controller Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

module.exports = {
  createBank,
  getBanks,
  getBankById,
  updateBank,
  deleteBank,
  setPrimaryBank,
};