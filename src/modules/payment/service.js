const crypto = require("crypto");
const Payment = require("./model");
const razorpay = require("./razorpay");
const User = require("../auth/model");
const Plan = require("../plan/model");
const SubscriptionHistory = require("../subscription-history/model");
const { validateAndCalculateDiscount, redeemCouponService } = require("../coupon/service");


// Create Order

const createOrder = async (userId, plan, couponCode = null) => {
  const normalizedSlug = (plan || "").toString().toLowerCase().trim();

  // Dynamically lookup plan from database (created/managed by super admin)
  let planDoc = await Plan.findOne({
    $or: [
      { slug: normalizedSlug, isCurrent: true },
      { slug: normalizedSlug },
      ...(normalizedSlug.length === 24 ? [{ _id: normalizedSlug }] : [])
    ]
  });

  if (!planDoc) {
    throw new Error(`Invalid or non-existent subscription plan '${plan}'`);
  }

  // If the plan is in draft status, auto-activate it so user payment succeeds
  if (planDoc.status === "draft") {
    planDoc.status = "active";
    await planDoc.save();
  }

  if (planDoc.status === "inactive") {
    throw new Error("This subscription plan is currently inactive");
  }

  if (planDoc.price <= 0) {
    throw new Error("Cannot create a payment order for a free plan");
  }
  
  const { getRatesMap, convertAmountWithRates, getUsdInrExchangeRate, roundCurrency } = require("../currency/service");

  // Fetch authenticated user to inspect user's display currency
  const user = await User.findById(userId);
  const userCurrency = String((user && user.currency) || "INR").toUpperCase().trim();

  const ratesMap = await getRatesMap();
  const exchangeRate = getUsdInrExchangeRate(ratesMap);

  const basePrice = planDoc.price;
  const baseCurrency = String(planDoc.currency || "INR").toUpperCase().trim();

  // 1. Calculate user display price in user's active currency
  const displayPrice = convertAmountWithRates(basePrice, baseCurrency, userCurrency, ratesMap);

  // 2. Convert display price to payable INR for Razorpay processing
  const payableINR = baseCurrency === "INR"
    ? basePrice
    : (userCurrency === "INR" ? displayPrice : convertAmountWithRates(displayPrice, userCurrency, "INR", ratesMap));

  let finalINR = payableINR;
  let discountINR = 0;

  if (couponCode) {
    const discountResult = await validateAndCalculateDiscount(couponCode, userId, planDoc.slug, payableINR);
    if (!discountResult.valid) {
      throw new Error(discountResult.message);
    }
    finalINR = discountResult.finalAmount;
    discountINR = discountResult.discountAmount;
  }
  
  // 3. Compute integer paise for Razorpay API (Rupees * 100)
  const razorpayAmountPaise = Math.round(finalINR * 100);

  // Razorpay API expects amount in subunit/paise (Rupees * 100)
  const order = await razorpay.orders.create({
    amount: razorpayAmountPaise,
    currency: "INR",
    receipt: `receipt_${Date.now()}`,
  });

  // Store complete audit Payment document in local database
  const payment = await Payment.create({
    userId,
    planId: planDoc._id,
    plan: planDoc.slug,
    basePrice,
    baseCurrency,
    displayPrice,
    displayCurrency: userCurrency,
    exchangeRate,
    amount: Math.round(finalINR),
    originalAmount: Math.round(payableINR),
    discountAmount: Math.round(discountINR),
    razorpayAmountPaise,
    couponCode,
    currency: "INR",
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

  // Dynamically compute subscription end date from Plan's durationDays
  const normalizedPlanSlug = (payment.plan || "").toString().toLowerCase().trim();
  const planDoc = await Plan.findOne({ slug: normalizedPlanSlug, isCurrent: true }) || await Plan.findOne({ slug: normalizedPlanSlug });
  let endDate = new Date();
  if (planDoc && planDoc.durationDays) {
    endDate.setDate(endDate.getDate() + planDoc.durationDays);
  } else if (payment.plan.includes('yearly')) {
    endDate.setFullYear(endDate.getFullYear() + 1);
  } else {
    endDate.setMonth(endDate.getMonth() + 1);
  }

  payment.status = "success";
  payment.razorpayPaymentId = razorpay_payment_id;
  payment.razorpaySignature = razorpay_signature;
  payment.paidAt = new Date();

  await payment.save();

  if (payment.couponCode) {
    const { getCouponByCode } = require("../coupon/repository");
    const coupon = await getCouponByCode(payment.couponCode);
    if (coupon) {
      await redeemCouponService(coupon._id, payment.userId, payment._id);
    }
  }

  user.subscription = {
    plan: planDoc ? planDoc.slug : payment.plan,
    status: "active",
    provider: "razorpay",
    startDate: new Date(),
    endDate,
    autoRenew: false,
  };

  await user.save();

  // Record subscription history entry
  try {
    const historyPlan = planDoc || await Plan.findOne({ slug: payment.plan, isCurrent: true }) || await Plan.findOne({ slug: payment.plan });
    await SubscriptionHistory.create({
      userId: user._id,
      planId: historyPlan ? historyPlan._id : null,
      paymentId: payment._id,
      action: "activated",
      provider: "razorpay",
      startDate: user.subscription.startDate,
      endDate: user.subscription.endDate,
      amount: payment.amount || 0,
      currency: payment.currency || "INR",
      note: `Subscription activated via Razorpay payment (${payment.plan}).`,
    });
  } catch (historyErr) {
    console.error("[Payment Service] Failed to create SubscriptionHistory entry:", historyErr);
  }

  // Send automatic SMTP invoice email to user
  try {
    const { sendInvoiceEmail } = require("../email/emailService");
    sendInvoiceEmail({
      userEmail: user.email,
      userName: user.fullName,
      payment,
      subscription: user.subscription,
    });
  } catch (emailError) {
    console.error("Failed to trigger automatic invoice email:", emailError);
  }

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