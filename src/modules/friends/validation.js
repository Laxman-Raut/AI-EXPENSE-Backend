const Joi = require("joi");

const sendFriendRequestSchema = Joi.object({
  recipientId: Joi.string()
    .length(24)
    .hex()
    .required()
    .messages({
      "any.required": "Recipient ID is required",
      "string.length": "Invalid Recipient ID",
      "string.hex": "Invalid Recipient ID",
    }),
});