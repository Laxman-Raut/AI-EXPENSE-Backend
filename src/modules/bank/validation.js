const Joi = require("joi");

const createBankSchema = Joi.object({
  bankName: Joi.string().trim().required().messages({
    "string.empty": "Bank name is required",
  }),

  bankCode: Joi.string().trim().uppercase().allow("", null),

  accountHolderName: Joi.string().trim().required().messages({
    "string.empty": "Account holder name is required",
  }),

  accountNumber: Joi.string()
    .pattern(/^[0-9]{9,18}$/)
    .required()
    .messages({
      "string.pattern.base": "Account number must be between 9 and 18 digits",
      "string.empty": "Account number is required",
    }),

  accountType: Joi.string()
    .valid("Savings", "Current")
    .default("Savings"),

  nickname: Joi.string().allow("", null),

  upiId: Joi.string()
    .pattern(/^[a-zA-Z0-9.\-_]{2,}@[a-zA-Z]{2,}$/)
    .allow("", null)
    .messages({
      "string.pattern.base": "Invalid UPI ID",
    }),

  isPrimary: Joi.boolean().default(false),
});

const updateBankSchema = Joi.object({
  bankName: Joi.string().trim(),

  bankCode: Joi.string().trim().uppercase().allow("", null),

  accountHolderName: Joi.string().trim(),

  accountNumber: Joi.string().pattern(/^[0-9]{9,18}$/),

  accountType: Joi.string().valid("Savings", "Current"),

  nickname: Joi.string().allow("", null),

  upiId: Joi.string()
    .pattern(/^[a-zA-Z0-9.\-_]{2,}@[a-zA-Z]{2,}$/)
    .allow("", null),

  isPrimary: Joi.boolean(),
});

module.exports = {
  createBankSchema,
  updateBankSchema,
};