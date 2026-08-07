const service = require("./service");

const createCouponCtrl = async (req, res) => {
  try {
    const coupon = await service.createCouponService(req.body, req.user.userId);
    res.status(201).json({ success: true, message: "Coupon created successfully", data: coupon });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message || "Failed to create coupon" });
  }
};

const getAllCouponsCtrl = async (req, res) => {
  try {
    const filters = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      search: req.query.search,
      status: req.query.status
    };
    const result = await service.getAllCouponsService(filters);
    res.status(200).json({ success: true, message: "Coupons retrieved successfully", data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Failed to retrieve coupons" });
  }
};

const getCouponByIdCtrl = async (req, res) => {
  try {
    const coupon = await service.getCouponByIdService(req.params.id);
    if (!coupon) {
      return res.status(404).json({ success: false, message: "Coupon not found" });
    }
    res.status(200).json({ success: true, message: "Coupon retrieved successfully", data: coupon });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Failed to retrieve coupon" });
  }
};

const updateCouponCtrl = async (req, res) => {
  try {
    const coupon = await service.updateCouponService(req.params.id, req.body);
    if (!coupon) {
      return res.status(404).json({ success: false, message: "Coupon not found" });
    }
    res.status(200).json({ success: true, message: "Coupon updated successfully", data: coupon });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message || "Failed to update coupon" });
  }
};

const toggleCouponStatusCtrl = async (req, res) => {
  try {
    const coupon = await service.toggleCouponStatusService(req.params.id);
    if (!coupon) {
      return res.status(404).json({ success: false, message: "Coupon not found" });
    }
    res.status(200).json({ success: true, message: "Coupon status updated successfully", data: coupon });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Failed to update coupon status" });
  }
};

const deleteCouponCtrl = async (req, res) => {
  try {
    const coupon = await service.deleteCouponService(req.params.id);
    if (!coupon) {
      return res.status(404).json({ success: false, message: "Coupon not found" });
    }
    res.status(200).json({ success: true, message: "Coupon deleted successfully", data: null });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Failed to delete coupon" });
  }
};

const getCouponStatsCtrl = async (req, res) => {
  try {
    const stats = await service.getCouponStatsService();
    res.status(200).json({ success: true, message: "Coupon stats retrieved successfully", data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Failed to retrieve coupon stats" });
  }
};

const validateCouponCtrl = async (req, res) => {
  try {
    const { code, planSlug } = req.body;
    // Note: To validate a coupon, we also need the planPrice, which can be fetched from Plan model.
    // Assuming the frontend might not pass the correct price, we fetch it.
    const Plan = require("../plan/model");
    const plan = await Plan.findOne({ slug: planSlug });
    if (!plan) {
      return res.status(404).json({ success: false, message: "Plan not found" });
    }
    
    const result = await service.validateAndCalculateDiscount(code, req.user.userId, planSlug, plan.price);
    if (!result.valid) {
      return res.status(400).json({ success: false, message: result.message });
    }
    
    res.status(200).json({ 
      success: true, 
      message: "Coupon validated successfully", 
      data: {
        discountAmount: result.discountAmount,
        finalAmount: result.finalAmount,
        couponId: result.coupon._id,
        code: result.coupon.code
      } 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Failed to validate coupon" });
  }
};

module.exports = {
  createCouponCtrl,
  getAllCouponsCtrl,
  getCouponByIdCtrl,
  updateCouponCtrl,
  toggleCouponStatusCtrl,
  deleteCouponCtrl,
  getCouponStatsCtrl,
  validateCouponCtrl
};
