const { registerSchema, loginSchema } = require("./validation");

const validateRegister = (req, res, next) => {
  try {
    registerSchema.parse(req.body);
    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.issues.map(i => i.message).join(", "),
      errors: error.issues,
    });
  }
};

const validateLogin = (req, res, next) => {
  try {
    loginSchema.parse(req.body);
    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.issues.map(i => i.message).join(", "),
      errors: error.issues,
    });
  }
};

module.exports = {
  validateRegister,
  validateLogin,
};