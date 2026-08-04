const Bank = require("./model");

/**
 * Create Bank Account
 */
const createBank = async (userId, bankData) => {
  try {
    // Check duplicate account number
    const existingBank = await Bank.findOne({
      user: userId,
      accountNumber: bankData.accountNumber,
    });

    if (existingBank) {
      return {
        success: false,
        statusCode: 400,
        message: "Bank account already exists.",
      };
    }

    // Count user's bank accounts
    const bankCount = await Bank.countDocuments({
      user: userId,
    });

    // First bank becomes primary automatically
    if (bankCount === 0) {
      bankData.isPrimary = true;
    }

    // If user selected primary bank
    if (bankData.isPrimary && bankCount > 0) {
      await Bank.updateMany(
        { user: userId },
        {
          $set: {
            isPrimary: false,
          },
        }
      );
    }

    // Create bank
    const bank = await Bank.create({
      user: userId,
      ...bankData,
    });

    return {
      success: true,
      statusCode: 201,
      message: "Bank account added successfully.",
      data: bank,
    };
  } catch (error) {
    console.error("Create Bank Error:", error);

    return {
      success: false,
      statusCode: 500,
      message: "Internal Server Error",
    };
  }
};

/**
 * Get All Bank Accounts
 */
const getBanks = async (userId) => {
  try {
    const banks = await Bank.find({
      user: userId,
    }).sort({
      isPrimary: -1,
      createdAt: -1,
    });

    return {
      success: true,
      statusCode: 200,
      data: banks,
    };
  } catch (error) {
    console.error("Get Banks Error:", error);

    return {
      success: false,
      statusCode: 500,
      message: "Internal Server Error",
    };
  }
};

/**
 * Get Single Bank
 */
const getBankById = async (userId, bankId) => {
  try {
    const bank = await Bank.findOne({
      _id: bankId,
      user: userId,
    });

    if (!bank) {
      return {
        success: false,
        statusCode: 404,
        message: "Bank account not found.",
      };
    }

    return {
      success: true,
      statusCode: 200,
      data: bank,
    };
  } catch (error) {
    console.error("Get Bank Error:", error);

    return {
      success: false,
      statusCode: 500,
      message: "Internal Server Error",
    };
  }
};


/**
 * Update Bank Account
 */
const updateBank = async (userId, bankId, bankData) => {
  try {
    const bank = await Bank.findOne({
      _id: bankId,
      user: userId,
    });

    if (!bank) {
      return {
        success: false,
        statusCode: 404,
        message: "Bank account not found.",
      };
    }

    // Prevent duplicate account number
    if (
      bankData.accountNumber &&
      bankData.accountNumber !== bank.accountNumber
    ) {
      const duplicate = await Bank.findOne({
        user: userId,
        accountNumber: bankData.accountNumber,
        _id: { $ne: bankId },
      });

      if (duplicate) {
        return {
          success: false,
          statusCode: 400,
          message: "Bank account already exists.",
        };
      }
    }

    // If setting as primary
    if (bankData.isPrimary === true) {
      await Bank.updateMany(
        { user: userId },
        {
          $set: {
            isPrimary: false,
          },
        }
      );
    }

    const updatedBank = await Bank.findByIdAndUpdate(
      bankId,
      bankData,
      {
        new: true,
        runValidators: true,
      }
    );

    return {
      success: true,
      statusCode: 200,
      message: "Bank account updated successfully.",
      data: updatedBank,
    };
  } catch (error) {
    console.error("Update Bank Error:", error);

    return {
      success: false,
      statusCode: 500,
      message: "Internal Server Error",
    };
  }
};


/**
 * Delete Bank Account
 */
const deleteBank = async (userId, bankId) => {
  try {
    const bank = await Bank.findOne({
      _id: bankId,
      user: userId,
    });

    if (!bank) {
      return {
        success: false,
        statusCode: 404,
        message: "Bank account not found.",
      };
    }

    await Bank.findByIdAndDelete(bankId);

    // If deleted bank was primary,
    // make another bank primary automatically
    if (bank.isPrimary) {
      const anotherBank = await Bank.findOne({
        user: userId,
      }).sort({
        createdAt: -1,
      });

      if (anotherBank) {
        anotherBank.isPrimary = true;
        await anotherBank.save();
      }
    }

    return {
      success: true,
      statusCode: 200,
      message: "Bank account deleted successfully.",
    };
  } catch (error) {
    console.error("Delete Bank Error:", error);

    return {
      success: false,
      statusCode: 500,
      message: "Internal Server Error",
    };
  }
};

/**
 * Set Primary Bank Account
 */
const setPrimaryBank = async (userId, bankId) => {
  try {
    // Check if bank exists
    const bank = await Bank.findOne({
      _id: bankId,
      user: userId,
    });

    if (!bank) {
      return {
        success: false,
        statusCode: 404,
        message: "Bank account not found.",
      };
    }

    // Remove primary from all user banks
    await Bank.updateMany(
      { user: userId },
      {
        $set: {
          isPrimary: false,
        },
      }
    );

    // Make selected bank primary
    bank.isPrimary = true;
    await bank.save();

    return {
      success: true,
      statusCode: 200,
      message: "Primary bank updated successfully.",
      data: bank,
    };
  } catch (error) {
    console.error("Set Primary Bank Error:", error);

    return {
      success: false,
      statusCode: 500,
      message: "Internal Server Error",
    };
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