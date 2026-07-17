const Payment = require("./model");
const razorpay = require("./razorpay");

const createOrder = async (userId, plan) => {
  let amount = 0;

  switch (plan) {
    case "pro_monthly":
      amount = 19900; // ₹199
      break;

    case "pro_yearly":
      amount = 199900; // ₹1999
      break;

    default:
      throw new Error("Invalid subscription plan");
  }

  // Create Razorpay Order
  const order = await razorpay.orders.create({
    amount,
    currency: "INR",
    receipt: `receipt_${Date.now()}`,
  });

  // Save pending payment
  const payment = await Payment.create({
    userId,
    amount,
    currency: "INR",
    plan,
    provider: "razorpay",
    status: "pending",
    razorpayOrderId: order.id,
  });

  return {
    order,
    payment,
  };
};

module.exports = {
  createOrder,
};