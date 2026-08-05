/**
 * Generate a NPCI-compliant UPI deep link.
 *
 * NPCI UPI Linking Spec v2.0 rules enforced:
 *  - pa  : Payee UPI VPA. Must be valid (username@bank). `@` remains literal so Android Intent filters match.
 *  - pn  : Payee name — cleaned of newlines/tabs, URL-encoded using encodeURIComponent(), ASCII only, max 50 chars.
 *  - am  : Amount — numeric decimal string formatted to 2 decimal places, > 0.
 *  - cu  : Always "INR", URL-encoded.
 *  - tn  : Transaction note — cleaned of newlines/tabs, URL-encoded using encodeURIComponent(), ASCII only, max 50 chars.
 *  - tr  : Transaction reference — unique per payment, ALPHANUMERIC ONLY (no hyphens, spaces, or special chars), max 35 chars.
 *  - mode: "00" = Standard / Static / P2P Intent initiation.
 *          NOTE: mode=02 designates Merchant Dynamic QR / Secure Merchant Intent (requires orgid/sign).
 *          Using mode=02 for P2P transfers without merchant signatures causes GPay and PhonePe to trigger
 *          unverified merchant security checks and reject the payment with "Transaction limit exceeded".
 *
 * DO NOT append &package=... to a upi:// URL — package is an Android Intent
 * extra and must only appear in intent:// URIs, never in upi:// deep links.
 */
const generateDeepLink = ({ upiId, name, amount, note, transactionRef }) => {
  if (!upiId) {
    throw new Error('Payee UPI ID is required');
  }

  // A valid UPI VPA must contain username@bank handle.
  const cleanUpiId = upiId.trim().replace(/\s/g, '');
  const vpaRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/;
  if (!vpaRegex.test(cleanUpiId)) {
    throw new Error(`Invalid UPI ID format: "${cleanUpiId}". Must be a valid VPA (e.g. name@bank)`);
  }

  const numericAmount = Number(amount);
  if (!amount || isNaN(numericAmount) || numericAmount <= 0) {
    throw new Error('Amount must be a numeric value greater than 0');
  }

  // Amount as decimal numeric string (e.g. 100.00 or 100.50)
  const amountStr = numericAmount.toFixed(2);

  // Sanitise text fields: remove newlines/tabs, strip non-ASCII, collapse spaces, trim, cap length.
  const cleanName = (name || 'Payee')
    .replace(/[\r\n\t]/g, ' ')
    .replace(/[^\x20-\x7E]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 50);

  const cleanNote = (note || 'Split Expense')
    .replace(/[\r\n\t]/g, ' ')
    .replace(/[^\x20-\x7E]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 50);

  // tr must be alphanumeric only — hyphens and special chars cause rejections in UPI apps.
  // Strip everything that is not a letter or digit, then cap at 35 chars.
  const rawRef = transactionRef || `TR${Date.now()}`;
  const tr = rawRef.replace(/[^a-zA-Z0-9]/g, '').substring(0, 35);
  if (!tr) {
    throw new Error('Transaction reference must contain alphanumeric characters');
  }

  // URL-encode query parameter values using encodeURIComponent()
  const safeName = encodeURIComponent(cleanName);
  const safeAm = encodeURIComponent(amountStr);
  const safeCu = encodeURIComponent('INR');
  const safeNote = encodeURIComponent(cleanNote);
  const safeTr = encodeURIComponent(tr);
  const safeMode = encodeURIComponent('00');

  // Build the NPCI-compliant deep link.
  // pa uses cleanUpiId with literal '@' for Android Intent filter compatibility.
  const deepLink =
    `upi://pay?pa=${cleanUpiId}` +
    `&pn=${safeName}` +
    `&am=${safeAm}` +
    `&cu=${safeCu}` +
    `&tn=${safeNote}` +
    `&tr=${safeTr}` +
    `&mode=${safeMode}`;

  console.log('[UPI Service] Generated NPCI UPI URI:', deepLink);
  return deepLink;
};

module.exports = { generateDeepLink };