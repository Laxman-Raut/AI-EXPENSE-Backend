const generateDeepLink = ({ upiId, name, amount, note }) => {
  if (!upiId) {
    throw new Error("UPI ID is required");
  }

  if (!amount || amount <= 0) {
    throw new Error("Invalid amount");
  }

  const deepLink =
    `upi://pay?` +
    `pa=${encodeURIComponent(upiId)}` +
    `&pn=${encodeURIComponent(name)}` +
    `&am=${amount}` +
    `&cu=INR` +
    `&tn=${encodeURIComponent(note || "AI Expense Settlement")}`;

  return deepLink;
};

module.exports = {
  generateDeepLink,
};