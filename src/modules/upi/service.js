const generateDeepLink = ({ upiId, name, amount, note }) => {
  if (!upiId) {
    throw new Error("UPI ID is required");
  }

  if (!amount || amount <= 0) {
    throw new Error("Invalid amount");
  }

  const formattedAmount = Number(amount).toFixed(2);
  const transactionRef = `TR${Date.now()}`;

  const deepLink =
    `upi://pay?` +
    `pa=${encodeURIComponent(upiId)}` +
    `&pn=${encodeURIComponent(name)}` +
    `&am=${formattedAmount}` +
    `&cu=INR` +
    `&tn=${encodeURIComponent(note || "AI Expense Settlement")}` +
    `&tr=${transactionRef}` +
    `&mode=00`;

  return deepLink;
};

module.exports = {
  generateDeepLink,
};