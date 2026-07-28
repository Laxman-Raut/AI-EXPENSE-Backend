const SplitRequest = require("../splitRequests/model");
const User = require("../auth/model");
const upiService = require("./service");

const getUserId = (userObj) => {
  if (!userObj) return "";
  if (typeof userObj === "object") return (userObj._id || userObj.id || "").toString();
  return userObj.toString();
};

const generateDeepLink = async (req, res, next) => {
  try {
    const { splitRequestId } = req.body;

    if (!splitRequestId) {
      return res.status(400).json({
        success: false,
        message: "splitRequestId is required",
      });
    }

    // Find Split Request
    const splitRequest = await SplitRequest.findById(splitRequestId);

    if (!splitRequest) {
      return res.status(404).json({
        success: false,
        message: "Split request not found",
      });
    }

    const currentUserId = (req.user?.id || req.user?.userId || req.user?._id || "").toString();

    // Find logged-in user in participants
    const participant = splitRequest.participants.find(
      (p) => getUserId(p.user) === currentUserId
    );

    if (!participant) {
      return res.status(403).json({
        success: false,
        message: "You are not a participant of this expense.",
      });
    }

    // Already paid
    if (participant.status === "paid") {
      return res.status(400).json({
        success: false,
        message: "This expense is already paid.",
      });
    }

    // Find Admin (Person who paid for the split)
    const adminId = getUserId(splitRequest.paidBy);
    const admin = await User.findById(adminId);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Group admin not found.",
      });
    }

    if (!admin.upiId) {
      return res.status(400).json({
        success: false,
        message: "Group admin has not added a UPI ID.",
      });
    }

    // Generate Deep Link
    const deepLink = upiService.generateDeepLink({
      upiId: admin.upiId,
      name: admin.fullName,
      amount: participant.amount,
      note: splitRequest.title,
    });

    return res.status(200).json({
      success: true,
      message: "UPI Deep Link generated successfully.",
      data: {
        deepLink,
        amount: participant.amount,
        receiver: admin.fullName,
        upiId: admin.upiId,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  generateDeepLink,
};