const isMongoId = (id) => typeof id === "string" && /^[0-9a-fA-F]{24}$/.test(id);

const validateSendFriendRequest = (req, res, next) => {
  const { recipientId } = req.body || {};
  if (!recipientId) {
    return res.status(400).json({
      success: false,
      message: "Recipient ID is required",
    });
  }
  if (!isMongoId(recipientId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid Recipient ID",
    });
  }
  next();
};

const validateRespondFriendRequest = (req, res, next) => {
  const { requestId } = req.body || {};
  if (!requestId) {
    return res.status(400).json({
      success: false,
      message: "Request ID is required",
    });
  }
  if (!isMongoId(requestId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid Request ID",
    });
  }
  next();
};

module.exports = {
  validateSendFriendRequest,
  validateRespondFriendRequest,
};