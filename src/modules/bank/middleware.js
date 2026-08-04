const {
  createBankSchema,
  updateBankSchema,
} = require("./validation");

const validateCreateBank = (req, res, next) => {
  const { error } = createBankSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: error.details.map((err) => err.message),
    });
  }

  next();
};

const validateUpdateBank = (req, res, next) => {
  const { error } = updateBankSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: error.details.map((err) => err.message),
    });
  }

  next();
};

module.exports = {
  validateCreateBank,
  validateUpdateBank,
};