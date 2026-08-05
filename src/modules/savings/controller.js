const savingsService = require("./service");

const getJars = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;
    const result = await savingsService.getJars(userId, status);

    return res.status(200).json({
      success: true,
      message: "Savings Jars retrieved successfully",
      data: result.jars,
      summary: result.summary,
    });
  
      data: result.jars,
      summary: result.summary,
    });
  } catch (error) {
} catch (error) {
    next(error);
  }
};

const getJarById = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const jar = await savingsService.getJarById(userId, id);

    return res.status(200).json({
      success: true,
      data: jar,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
};

const createJar = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const jar = await savingsService.createJar(userId, req.body);

    return res.status(201).json({
      success: true,
      message: "Savings Jar created successfully",
      data: jar,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
        code: error.code,
      });
    }
    next(error);
  }
};

const updateJar = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const jar = await savingsService.updateJar(userId, id, req.body);

    return res.status(200).json({
      success: true,
      message: "Savings Jar updated successfully",
      data: jar,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
};

const deleteJar = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const result = await savingsService.deleteJar(userId, id);

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
};

const deposit = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { amount, notes } = req.body;

    const jar = await savingsService.deposit(userId, id, amount, notes);

    return res.status(200).json({
      success: true,
      message: `Successfully deposited ₹${amount} into ${jar.name}`,
      data: jar,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
};

const withdraw = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { amount, notes } = req.body;

    const jar = await savingsService.withdraw(userId, id, amount, notes);

    return res.status(200).json({
      success: true,
      message: `Successfully withdrew ₹${amount} from ${jar.name}`,
      data: jar,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
};

const transfer = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { fromJarId, toJarId, amount, notes } = req.body;

    const result = await savingsService.transfer(userId, fromJarId, toJarId, amount, notes);

    return res.status(200).json({
      success: true,
      message: result.message,
      data: result,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
};

const getAISuggestions = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await savingsService.getAISuggestions(userId);

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

  }
};

module.exports = {
  getJars,
  getJarById,
  createJar,
  updateJar,
  deleteJar,
  deposit,
  withdraw,
  transfer,
  getAISuggestions,

};
