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

    // Find Payer (Person who paid for the split)
    const payerId = getUserId(splitRequest.paidBy);
    const payer = await User.findById(payerId);

    if (!payer) {
      return res.status(404).json({
        success: false,
        message: "Expense creator details not found.",
      });
    }

    if (!payer.upiId || !payer.upiId.trim()) {
      const payerName = payer.fullName || "Expense Creator";
      return res.status(400).json({
        success: false,
        message: `${payerName} has not added their UPI ID in Profile Settings. Please ask them to add their UPI ID.`,
      });
    }

    // Generate Deep Link
    const deepLink = upiService.generateDeepLink({
      upiId: payer.upiId.trim(),
      name: payer.fullName,
      amount: participant.amount,
      note: splitRequest.title,
    });

    return res.status(200).json({
      success: true,
      message: "UPI Deep Link generated successfully.",
      data: {
        deepLink,
        amount: participant.amount,
        receiver: payer.fullName,
        upiId: payer.upiId.trim(),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  generateDeepLink,
};