const repository = require("./repository");

const createCouponService = async (data, adminId) => {
  data.createdBy = adminId;
  return await repository.createCoupon(data);
};

const getAllCouponsService = async (filters) => {
  return await repository.getAllCoupons(filters);
};

const getCouponByIdService = async (id) => {
  return await repository.getCouponById(id);
};

const updateCouponService = async (id, data) => {
  return await repository.updateCoupon(id, data);
};

const toggleCouponStatusService = async (id) => {
  return await repository.toggleCouponStatus(id);
};

const deleteCouponService = async (id) => {
  return await repository.deleteCoupon(id);
};

const getCouponStatsService = async () => {
  return await repository.getCouponStats();
};

const validateAndCalculateDiscount = async (code, userId, planSlug, planPrice) => {
  return await repository.validateCoupon(code, userId, planSlug, planPrice);
};

const redeemCouponService = async (couponId, userId, paymentId) => {
  return await repository.redeemCoupon(couponId, userId, paymentId);
};

module.exports = {
  createCouponService,
  getAllCouponsService,
  getCouponByIdService,
  updateCouponService,
  toggleCouponStatusService,
  deleteCouponService,
  getCouponStatsService,
  validateAndCalculateDiscount,
  redeemCouponService
};
