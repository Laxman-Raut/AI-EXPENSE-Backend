const SplitRequest = require('../splitRequests/model');
const User = require('../auth/model');
const upiService = require('./service');

/**
 * Extracts a string ID from a Mongoose document, ObjectId, or plain string.
 * Works correctly whether the field is populated (returns a document) or not
 * (returns a raw ObjectId whose .toString() gives the hex string).
 */
const toStringId = (ref) => {
  if (!ref) return '';
  if (typeof ref === 'string') return ref;
  // Mongoose ObjectId has a toString() that returns the 24-char hex string.
  // A populated document has ._id which is itself an ObjectId.
  if (ref._id) return ref._id.toString();
  return ref.toString();
};

const generateDeepLink = async (req, res, next) => {
  try {
    const { splitRequestId } = req.body;

    if (!splitRequestId) {
      return res.status(400).json({
        success: false,
        message: 'splitRequestId is required',
      });
    }

    // Populate both paidBy and participants.user so we get full User documents
    // and don't have to do separate findById calls for every field.
    const splitRequest = await SplitRequest.findById(splitRequestId)
      .populate('paidBy', 'fullName email mobile upiId')
      .populate('participants.user', '_id');

    if (!splitRequest) {
      return res.status(404).json({
        success: false,
        message: 'Split request not found',
      });
    }

    const currentUserId = (
      req.user?.id || req.user?.userId || req.user?._id || ''
    ).toString();

    const payer = splitRequest.paidBy;           // populated User doc (or null)
    const payerId = toStringId(payer || splitRequest.paidBy);

    // ─── Self-payment guard ───────────────────────────────────────────────
    // The person who created the split (paidBy) is the one who must RECEIVE
    // money, not pay. If they try to generate a link for themselves we block it.
    if (payerId === currentUserId) {
      return res.status(400).json({
        success: false,
        message:
          'You created and paid for this expense. You cannot pay yourself — wait for your group members to pay their share.',
      });
    }

    // ─── Participant check ────────────────────────────────────────────────
    const participant = (splitRequest.participants || []).find(
      (p) => toStringId(p.user) === currentUserId
    );

    if (!participant) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant of this expense.',
      });
    }

    if (participant.status === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'You have already paid your share for this expense.',
      });
    }

    // ─── Receiver UPI ID resolution ───────────────────────────────────────
    // Priority: explicit upiId on profile → fallback (we can't make up a VPA)
    if (!payer) {
      return res.status(404).json({
        success: false,
        message: 'Expense creator details not found.',
      });
    }

    const rawUpiId = payer.upiId ? payer.upiId.trim() : '';
    if (!rawUpiId || !rawUpiId.includes('@')) {
      const payerName = payer.fullName || 'Expense Creator';
      return res.status(400).json({
        success: false,
        message: `${payerName} has not added a valid UPI ID in their Profile Settings. Please ask them to add their UPI ID (format: name@bank) before you can pay.`,
        code: 'MISSING_UPI_ID',
      });
    }

    // ─── Amount ───────────────────────────────────────────────────────────
    const amountToPay =
      participant.amount > 0 ? participant.amount : splitRequest.totalAmount;

    if (!amountToPay || amountToPay <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment amount. Please contact the expense creator.',
      });
    }

    // ─── Unique transaction reference ─────────────────────────────────────
    // Combining timestamp + last 8 chars of splitRequestId gives a short,
    // unique, collision-resistant reference that GPay/PhonePe accept.
    const transactionRef = `${Date.now()}-${splitRequestId.toString().slice(-8)}`;

    // ─── Generate NPCI-compliant deep link ────────────────────────────────
    const deepLink = upiService.generateDeepLink({
      upiId: rawUpiId,
      name: payer.fullName || 'Payee',
      amount: amountToPay,
      note: splitRequest.title || 'Split Expense',
      transactionRef,
    });

    return res.status(200).json({
      success: true,
      message: 'UPI Deep Link generated successfully.',
      data: {
        deepLink,
        amount: amountToPay,
        receiver: payer.fullName || 'Payee',
        upiId: rawUpiId,
        transactionRef,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { generateDeepLink };