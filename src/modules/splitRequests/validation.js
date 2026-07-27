const validateCreateSplitRequest = (req, res, next) => {
  const {
    title,
    amount,
    totalAmount,
    group,
    paidBy,
    splitType,
    participants,
  } = req.body || {};

  if (!title || typeof title !== "string" || title.trim() === "") {
    return res.status(400).json({
      success: false,
      message: "Title is required",
    });
  }

  const finalAmount = Number(totalAmount || amount);
  if (!finalAmount || isNaN(finalAmount) || finalAmount <= 0) {
    return res.status(400).json({
      success: false,
      message: "Valid total amount is required",
    });
  }

  if (!group) {
    return res.status(400).json({
      success: false,
      message: "Group is required",
    });
  }

  if (!paidBy) {
    return res.status(400).json({
      success: false,
      message: "Payer is required",
    });
  }

  const allowedTypes = ["equal", "exact", "percentage", "shares"];
  const type = splitType || "equal";

  if (!allowedTypes.includes(type)) {
    return res.status(400).json({
      success: false,
      message: "Invalid split type",
    });
  }

  if (!participants || !Array.isArray(participants)) {
    return res.status(400).json({
      success: false,
      message: "Participants are required",
    });
  }

  if (participants.length < 1) {
    return res.status(400).json({
      success: false,
      message: "At least one participant is required",
    });
  }

  next();
};

module.exports = {
  validateCreateSplitRequest,
};