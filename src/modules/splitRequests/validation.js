const validateCreateSplitRequest = (req, res, next) => {
  const {
    title,
    amount,
    totalAmount,
    group,
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

  // Default paidBy to current authenticated user if not explicitly provided
  if (!req.body.paidBy) {
    const currentUserId = req.user?.userId || req.user?.id || req.user?._id;
    if (currentUserId) {
      req.body.paidBy = currentUserId;
    } else {
      return res.status(400).json({
        success: false,
        message: "Payer is required",
      });
    }
  }

  const allowedTypes = ["equal", "exact", "percentage", "shares"];
  const type = splitType || "equal";

  if (!allowedTypes.includes(type)) {
    return res.status(400).json({
      success: false,
      message: "Invalid split type",
    });
  }

  if (!participants || !Array.isArray(participants) || participants.length < 1) {
    return res.status(400).json({
      success: false,
      message: "At least one participant is required",
    });
  }

  // Exact & Percentage validation checks
  if (type === "exact") {
    const totalExact = participants.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    if (Math.abs(totalExact - finalAmount) > 0.5) {
      return res.status(400).json({
        success: false,
        message: `Sum of participant amounts (${totalExact.toFixed(2)}) must equal total amount (${finalAmount.toFixed(2)})`,
      });
    }
  } else if (type === "percentage") {
    const totalPct = participants.reduce((sum, p) => sum + Number(p.percentage || 0), 0);
    if (Math.abs(totalPct - 100) > 0.5) {
      return res.status(400).json({
        success: false,
        message: `Sum of participant percentages (${totalPct}%) must equal 100%`,
      });
    }
  }

  // Sanitize participant statuses: Only the paidBy user can be 'paid' upon creation
  const payerIdStr = String(req.body.paidBy);
  req.body.participants = participants.map((p) => {
    const pUserIdStr = String(typeof p.user === "object" ? p.user._id || p.user.id : p.user);
    return {
      ...p,
      status: pUserIdStr === payerIdStr ? "paid" : "pending",
    };
  });

  next();
};

module.exports = {
  validateCreateSplitRequest,
};