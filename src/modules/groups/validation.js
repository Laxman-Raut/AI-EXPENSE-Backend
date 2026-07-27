const Joi = require("joi");
const mongoose = require("mongoose");

// Create Group Validation
const createGroupSchema = Joi.object({
  name: Joi.string().trim().min(3).max(50).required().messages({
    "string.empty": "Group name is required",
    "string.min": "Group name must be at least 3 characters",
    "string.max": "Group name cannot exceed 50 characters",
  }),

  description: Joi.string().trim().max(200).allow("").optional(),
});

// Validation Middleware
const validateCreateGroup = (req, res, next) => {
  const { error } = createGroupSchema.validate(req.body);

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }

  next();
};

// Validate Mongo ObjectId
const validateObjectId = (req, res, next) => {
  const { groupId, memberId } = req.params;

  if (groupId && !mongoose.Types.ObjectId.isValid(groupId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid Group ID",
    });
  }

  if (memberId && !mongoose.Types.ObjectId.isValid(memberId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid Member ID",
    });
  }

  next();
};

module.exports = {
  validateCreateGroup,
  validateObjectId,
};