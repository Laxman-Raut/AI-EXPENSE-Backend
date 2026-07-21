const {
  createPlanService,
  getAllPlansService,
  getPublicPlansService,
  getPlanByIdService,
  getPlanHistoryService,
  createPlanVersionService,
  updateDraftPlanService,
  deletePlanService,
} = require("./service");

// ======================================
// Create Plan
// ======================================
const createPlan = async (req, res) => {
  try {
    const plan = await createPlanService(req.body, req.user.userId);

    res.status(201).json({
      success: true,
      message: "Plan created successfully.",
      data: plan,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================
// Get All Plans (Admin)
// ======================================
const getAllPlans = async (req, res) => {
  try {
    const plans = await getAllPlansService();

    res.status(200).json({
      success: true,
      data: plans,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================
// Get Public Plans (Mobile App)
// ======================================
const getPublicPlans = async (req, res) => {
  try {
    const plans = await getPublicPlansService();

    res.status(200).json({
      success: true,
      data: plans,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================
// Get Plan By ID
// ======================================
const getPlanById = async (req, res) => {
  try {
    const plan = await getPlanByIdService(req.params.id);

    res.status(200).json({
      success: true,
      data: plan,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================
// Get Plan History
// ======================================
const getPlanHistory = async (req, res) => {
  try {
    const plans = await getPlanHistoryService(req.params.slug);

    res.status(200).json({
      success: true,
      data: plans,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================
// Create New Plan Version
// ======================================
const createPlanVersion = async (req, res) => {
  try {
    const plan = await createPlanVersionService(
      req.params.id,
      req.body,
      req.user.userId
    );

    res.status(200).json({
      success: true,
      message: "New plan version created successfully.",
      data: plan,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================
// Update Draft Plan
// ======================================
const updateDraftPlan = async (req, res) => {
  try {
    const plan = await updateDraftPlanService(
      req.params.id,
      req.body,
      req.user.userId
    );

    res.status(200).json({
      success: true,
      message: "Draft plan updated successfully.",
      data: plan,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================
// Delete Draft Plan
// ======================================
const removePlan = async (req, res) => {
  try {
    const result = await deletePlanService(req.params.id);

    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createPlan,
  getAllPlans,
  getPublicPlans,
  getPlanById,
  getPlanHistory,
  createPlanVersion,
  updateDraftPlan,
  removePlan,
};