const Joi = require("joi");

const createJarSchema = Joi.object({
  name: Joi.string().trim().max(100).required().messages({
    "string.empty": "Jar name is required",
    "string.max": "Jar name cannot exceed 100 characters",
  }),
  icon: Joi.string().trim().default("🏆"),
  color: Joi.string().trim().default("#4C6EF5"),
  targetAmount: Joi.number().min(0).allow(null, "").default(null),
  notes: Joi.string().trim().allow("", null).default(""),
});

const updateJarSchema = Joi.object({
  name: Joi.string().trim().max(100),
  icon: Joi.string().trim(),
  color: Joi.string().trim(),
  targetAmount: Joi.number().min(0).allow(null, ""),
  notes: Joi.string().trim().allow("", null),
  status: Joi.string().valid("active", "completed", "archived"),
});

const depositSchema = Joi.object({
  amount: Joi.number().positive().required().messages({
    "number.base": "Deposit amount must be a number",
    "number.positive": "Deposit amount must be greater than 0",
    "any.required": "Deposit amount is required",
  }),
  notes: Joi.string().trim().allow("", null).default(""),
});

const withdrawSchema = Joi.object({
  amount: Joi.number().positive().required().messages({
    "number.base": "Withdraw amount must be a number",
    "number.positive": "Withdraw amount must be greater than 0",
    "any.required": "Withdraw amount is required",
  }),
  notes: Joi.string().trim().allow("", null).default(""),
});

const transferSchema = Joi.object({
  fromJarId: Joi.string().required().messages({
    "any.required": "Source jar ID is required",
  }),
  toJarId: Joi.string().required().messages({
    "any.required": "Destination jar ID is required",
  }),
  amount: Joi.number().positive().required().messages({
    "number.base": "Transfer amount must be a number",
    "number.positive": "Transfer amount must be greater than 0",
    "any.required": "Transfer amount is required",
  }),
  notes: Joi.string().trim().allow("", null).default(""),
});

const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errorMessages = error.details.map((detail) => detail.message);
      return res.status(400).json({
        success: false,
        message: errorMessages.join(", "),
        errors: errorMessages,
      });
    }

    req.body = value;
    next();
  };
};

module.exports = {
  createJarSchema,
  updateJarSchema,
  depositSchema,
  withdrawSchema,
  transferSchema,
  validateRequest,
};
