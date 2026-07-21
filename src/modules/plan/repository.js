const Plan = require("./model");

// ======================================
// Create Plan
// ======================================
const createPlan = async (planData) => {
  return await Plan.create(planData);
};

// ======================================
// Find Current Plan By Slug
// ======================================
const findCurrentPlanBySlug = async (slug) => {
  return await Plan.findOne({
    slug,
    isCurrent: true,
  });
};

// ======================================
// Find Plan By ID
// ======================================
const findPlanById = async (id) => {
  return await Plan.findById(id);
};

// ======================================
// Get All Plans (Admin)
// ======================================
const findAllPlans = async () => {
  return await Plan.find().sort({
    displayOrder: 1,
    version: -1,
  });
};

// ======================================
// Get Public Plans (App)
// ======================================
const findPublicPlans = async () => {
  return await Plan.find({
    status: "active",
    visibility: "public",
    isCurrent: true,
  }).sort({
    displayOrder: 1,
  });
};

// ======================================
// Get Plan History
// ======================================
const findPlanHistory = async (slug) => {
  return await Plan.find({ slug }).sort({
    version: -1,
  });
};

// ======================================
// Archive Current Version
// ======================================
const archiveCurrentPlan = async (
  currentPlanId,
  newPlanId
) => {
  return await Plan.findByIdAndUpdate(
    currentPlanId,
    {
      isCurrent: false,
      status: "inactive",
      replacedBy: newPlanId,
    },
    {
      new: true,
    }
  );
};

// ======================================
// Activate New Version
// ======================================
const activatePlan = async (planId) => {
  return await Plan.findByIdAndUpdate(
    planId,
    {
      status: "active",
      isCurrent: true,
    },
    {
      new: true,
    }
  );
};

// ======================================
// Update Draft Plan
// ======================================
const updateDraftPlan = async (
  id,
  updateData
) => {
  return await Plan.findByIdAndUpdate(
    id,
    updateData,
    {
      new: true,
      runValidators: true,
    }
  );
};

// ======================================
// Delete Draft Plan
// ======================================
const deletePlan = async (id) => {
  return await Plan.findByIdAndDelete(id);
};

module.exports = {
  createPlan,
  findCurrentPlanBySlug,
  findPlanById,
  findAllPlans,
  findPublicPlans,
  findPlanHistory,
  archiveCurrentPlan,
  activatePlan,
  updateDraftPlan,
  deletePlan,
};