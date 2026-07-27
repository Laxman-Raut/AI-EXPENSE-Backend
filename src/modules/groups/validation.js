const mongoose = require("mongoose");

// Create Group Validation (Plain JS validation)
const validateCreateGroup = (req, res, next) => {
  const { name, description } = req.body || {};

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: "Group name is required",
    });
  }

  const trimmedName = name.trim();
  if (trimmedName.length < 3) {
    return res.status(400).json({
      success: false,
      message: "Group name must be at least 3 characters",
    });
  }

  if (trimmedName.length > 50) {
    return res.status(400).json({
      success: false,
      message: "Group name cannot exceed 50 characters",
    });
  }

  if (description && typeof description === "string" && description.trim().length > 200) {
    return res.status(400).json({
      success: false,
      message: "Description cannot exceed 200 characters",
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