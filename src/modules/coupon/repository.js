const Coupon = require("./model");
const CouponUsage = require("./couponUsage.model");
const Payment = require("../payment/model");
const Plan = require("../plan/model");

const createCoupon = async (data) => {
  if (data.code) {
    data.code = data.code.toUpperCase();
  }
  const coupon = new Coupon(data);
  return await coupon.save();
};

const getAllCoupons = async ({ page = 1, limit = 10, search, status }) => {
  const query = {};
  
  if (search) {
    query.$or = [
      { code: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  const now = new Date();
  if (status === "active") {
    query.isActive = true;
    query.validFrom = { $lte: now };
    query.validUntil = { $gte: now };
  } else if (status === "inactive") {
    query.isActive = false;
  } else if (status === "expired") {
    query.validUntil = { $lt: now };
  }

  const skip = (page - 1) * limit;

  const [coupons, total] = await Promise.all([
    Coupon.find(query)
      .populate("applicablePlans", "name slug")
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 }),
    Coupon.countDocuments(query),
  ]);

  return { coupons, total, page, totalPages: Math.ceil(total / limit) };
};

const getCouponById = async (id) => {
  return await Coupon.findById(id).populate("applicablePlans");
};

const getCouponByCode = async (code) => {
  return await Coupon.findOne({ code: code.toUpperCase() });
};

const updateCoupon = async (id, data) => {
  if (data.code) {
    data.code = data.code.toUpperCase();
  }
  return await Coupon.findByIdAndUpdate(id, data, { new: true, runValidators: true });
};

const toggleCouponStatus = async (id) => {
  const coupon = await Coupon.findById(id);
  if (!coupon) return null;
  coupon.isActive = !coupon.isActive;
  return await coupon.save();
};

const deleteCoupon = async (id) => {
  return await Coupon.findByIdAndDelete(id);
};

const getCouponStats = async () => {
  const now = new Date();
  const [totalCoupons, activeCoupons, expiredCoupons, totalRedemptions, discountStats] = await Promise.all([
    Coupon.countDocuments(),
    Coupon.countDocuments({ isActive: true, validFrom: { $lte: now }, validUntil: { $gte: now } }),
    Coupon.countDocuments({ validUntil: { $lt: now } }),
    Coupon.aggregate([
      { $group: { _id: null, total: { $sum: "$usedCount" } } }
    ]),
    Payment.aggregate([
      { $match: { couponCode: { $ne: null }, status: "completed" } },
      { $group: { _id: null, totalDiscount: { $sum: "$discountAmount" } } }
    ])
  ]);

  return {
    totalCoupons,
    activeCoupons,
    expiredCoupons,
    totalRedemptions: totalRedemptions[0]?.total || 0,
    totalDiscountGiven: discountStats[0]?.totalDiscount || 0
  };
};

const validateCoupon = async (code, userId, planSlug, planPrice) => {
  const coupon = await Coupon.findOne({ code: code.toUpperCase() }).populate("applicablePlans");
  if (!coupon) return { valid: false, message: "Coupon not found" };

  if (!coupon.isActive) return { valid: false, message: "Coupon is not active" };

  const now = new Date();
  if (now < coupon.validFrom || now > coupon.validUntil) {
    return { valid: false, message: "Coupon is expired or not yet valid" };
  }

  if (coupon.usedCount >= coupon.usageLimit) {
    return { valid: false, message: "Coupon usage limit reached" };
  }

  const isPlanApplicable = coupon.applicablePlans.some(plan => plan.slug === planSlug);
  if (!isPlanApplicable) {
    return { valid: false, message: "Coupon is not applicable for this plan" };
  }

  const usageCount = await CouponUsage.countDocuments({ couponId: coupon._id, userId });
  if (usageCount >= coupon.perUserLimit) {
    return { valid: false, message: "You have reached the usage limit for this coupon" };
  }

  if (planPrice < coupon.minPurchase) {
    return { valid: false, message: `Minimum purchase amount of ${coupon.minPurchase} required` };
  }

  let discountAmount = planPrice * (coupon.discountValue / 100);
  if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
    discountAmount = coupon.maxDiscount;
  }

  return {
    valid: true,
    coupon,
    discountAmount,
    finalAmount: planPrice - discountAmount
  };
};

const redeemCoupon = async (couponId, userId, paymentId) => {
  const coupon = await Coupon.findByIdAndUpdate(
    couponId,
    { $inc: { usedCount: 1 } },
    { new: true }
  );
  
  if (coupon) {
    await CouponUsage.create({
      couponId,
      userId,
      paymentId
    });
  }
  return coupon;
};

module.exports = {
  createCoupon,
  getAllCoupons,
  getCouponById,
  getCouponByCode,
  updateCoupon,
  toggleCouponStatus,
  deleteCoupon,
  getCouponStats,
  validateCoupon,
  redeemCoupon
};
