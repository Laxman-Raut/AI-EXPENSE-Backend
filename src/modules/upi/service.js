/**
 * Generate a NPCI-compliant UPI deep link.
 *
 * NPCI UPI Linking Spec v2.0 rules enforced:
 *  - pa  : UPI VPA. The '@' MUST remain a literal character (must NOT be %40-encoded).
 *  - pn  : Payee name — URL-encoded, ASCII only, max 50 chars.
 *  - am  : Amount — exactly 2 decimal places, no currency symbol.
 *  - cu  : Always "INR".
 *  - tn  : Transaction note — URL-encoded, ASCII only, max 50 chars.
 *  - tr  : Transaction reference — unique per payment; without this, GPay/PhonePe
 *          treat the intent as unverified and apply a ₹2000 per-tx limit.
 *  - mode: "00" = standard pay (required by PhonePe, ignored by others safely).
 *
 * DO NOT append &package=... to a upi:// URL — package is an Android Intent
 * extra and must only appear in intent:// URIs, never in upi:// deep links.
 */
const generateDeepLink = ({ upiId, name, amount, note, transactionRef }) => {
  if (!upiId) {
    throw new Error('UPI ID is required');
  }

  // A valid UPI VPA must contain exactly one '@' with content on both sides.
  const cleanUpiId = upiId.trim().replace(/\s/g, '');
  const parts = cleanUpiId.split('@');
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    throw new Error(`Invalid UPI ID format: "${cleanUpiId}". Must be user@bank`);
  }

  if (!amount || Number(amount) <= 0) {
    throw new Error('Amount must be greater than 0');
  }

  const amountStr = Number(amount).toFixed(2);

  // Sanitise text fields: strip non-ASCII (Devanagari etc.), trim, cap length.
  const safeName = encodeURIComponent(
    (name || 'Payee').replace(/[^\x20-\x7E]/g, '').trim().substring(0, 50)
  );
  const safeNote = encodeURIComponent(
    (note || 'Split Expense').replace(/[^\x20-\x7E]/g, '').trim().substring(0, 50)
  );

  // Use caller-supplied ref or generate a time-based one.
  const tr = (transactionRef || `${Date.now()}`).toString().substring(0, 35);

  // Build the NPCI-compliant deep link.
  // CRITICAL: pa uses the raw (un-encoded) VPA so '@' stays literal.
  return (
    `upi://pay?pa=${cleanUpiId}` +
    `&pn=${safeName}` +
    `&am=${amountStr}` +
    `&cu=INR` +
    `&tn=${safeNote}` +
    `&tr=${tr}` +
    `&mode=00`
  );
};

module.exports = { generateDeepLink };