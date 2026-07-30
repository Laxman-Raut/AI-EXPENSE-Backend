const SplitRequest = require("../splitRequests/model");
const User = require("../auth/model");
const upiService = require("./service");

const getUserId = (userObj) => {
  if (!userObj) return "";
  if (typeof userObj === "string") return userObj;
  if (typeof userObj === "object") {
    if (userObj._id) return userObj._id.toString();
    if (userObj.id && typeof userObj.id === "string") return userObj.id;
  }
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

    // Find Split Request with populated references
    const splitRequest = await SplitRequest.findById(splitRequestId)
      .populate("paidBy")
      .populate("participants.user");

    if (!splitRequest) {
      return res.status(404).json({
        success: false,
        message: "Split request not found",
      });
    }

    const currentUserId = (req.user?.id || req.user?.userId || req.user?._id || "").toString();

    // Find Payer (Person who paid for the split)
    const payer = splitRequest.paidBy || (await User.findById(getUserId(splitRequest.paidBy)));
    const payerId = payer ? getUserId(payer) : getUserId(splitRequest.paidBy);

    const isCreator = Boolean(payerId && payerId === currentUserId);

    // Find logged-in user in participants
    const participant = (splitRequest.participants || []).find(
      (p) => getUserId(p.user) === currentUserId
    );

    if (!participant && !isCreator) {
      return res.status(403).json({
        success: false,
        message: "You are not a participant of this expense.",
      });
    }

    // Already paid check (for non-creator participants)
    if (participant && participant.status === "paid" && !isCreator) {
      return res.status(400).json({
        success: false,
        message: "This expense is already paid.",
      });
    }

    // Determine target receiver (payer details)
    const receiverName = payer ? (payer.fullName || "Expense Creator") : "Expense Creator";
    
    // Determine UPI ID for receiver: use explicit upiId or smart fallback
    let receiverUpiId = payer && payer.upiId ? payer.upiId.trim() : "";
    if (!receiverUpiId) {
      if (payer && payer.email) {
        receiverUpiId = `${payer.email.split("@")[0]}@upi`;
      } else if (payer && payer.mobile) {
        receiverUpiId = `${payer.mobile}@upi`;
      } else {
        receiverUpiId = "payee@upi";
      }
    }

    // Determine amount to pay safely
    const amountToPay = (participant && participant.amount > 0)
      ? participant.amount
      : (splitRequest.totalAmount || splitRequest.amount || 1.00);

    // Generate Deep Link
    const deepLink = upiService.generateDeepLink({
      upiId: receiverUpiId,
      name: receiverName,
      amount: amountToPay,
      note: splitRequest.title || "Split Expense",
    });

    return res.status(200).json({
      success: true,
      message: "UPI Deep Link generated successfully.",
      data: {
        deepLink,
        amount: amountToPay,
        receiver: receiverName,
        upiId: receiverUpiId,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  generateDeepLink,
};