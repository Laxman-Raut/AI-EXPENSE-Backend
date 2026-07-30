const generateDeepLink = ({ upiId, name, amount, note }) => {
  if (!upiId) {
    throw new Error("UPI ID is required");
  }

  if (!amount || amount <= 0) {
    throw new Error("Invalid amount");
  }

  return (
    "upi://pay?" +
    `pa=${encodeURIComponent(upiId)}` +
    `&pn=${encodeURIComponent(name)}` +
    `&am=${Number(amount).toFixed(2)}` +
    `&cu=INR` +
    `&tn=${encodeURIComponent(note || "Split Expense")}`
  );
};

module.exports = {
  generateDeepLink,
};