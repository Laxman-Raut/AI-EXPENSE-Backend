const crypto = require("crypto");
const Payment = require("./model");
const razorpay = require("./razorpay");
const User = require("../auth/model");


// Create Order

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

  const order = await razorpay.orders.create({
    amount,
    currency: "INR",
    receipt: `receipt_${Date.now()}`,
  });

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


// Verify Payment

const verifyPayment = async ({
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
}) => {
  const body = razorpay_order_id + "|" + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    throw new Error("Invalid payment signature");
  }

  const payment = await Payment.findOne({
    razorpayOrderId: razorpay_order_id,
  });

  if (!payment) {
    throw new Error("Payment not found");
  }

  // Prevent duplicate verification
  if (payment.status === "success") {
    throw new Error("Payment already verified");
  }

  const user = await User.findById(payment.userId);

  if (!user) {
    payment.status = "failed";
    await payment.save();
    throw new Error("User not found");
  }

  let endDate = new Date();

  if (payment.plan === "pro_monthly") {
    endDate.setMonth(endDate.getMonth() + 1);
  } else if (payment.plan === "pro_yearly") {
    endDate.setFullYear(endDate.getFullYear() + 1);
  }

  payment.status = "success";
  payment.razorpayPaymentId = razorpay_payment_id;
  payment.razorpaySignature = razorpay_signature;
  payment.paidAt = new Date();

  await payment.save();

  user.subscription = {
    plan: "pro",
    status: "active",
    provider: "razorpay",
    startDate: new Date(),
    endDate,
    autoRenew: false,
  };

  await user.save();

  return {
    payment,
    subscription: user.subscription,
  };
};


// Payment History

const getPaymentHistory = async (userId) => {
  return await Payment.find({ userId })
    .sort({ createdAt: -1 });
};


// Payment Details

const getPaymentById = async (paymentId, userId) => {
  const payment = await Payment.findOne({
    _id: paymentId,
    userId,
  });

  if (!payment) {
    throw new Error("Payment not found");
  }

  return payment;
};

module.exports = {
  createOrder,
  verifyPayment,
  getPaymentHistory,
  getPaymentById,
};