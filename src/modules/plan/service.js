const {
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
} = require("./repository");

// Create Plan
const createPlanService = async (planData, adminId) => {
  const existingPlan = await findCurrentPlanBySlug(planData.slug);

  if (existingPlan) {
    throw new Error("Plan already exists.");
  }

  const features = [...new Set(planData.features)];

  return await createPlan({
    ...planData,
    features,
    createdBy: adminId,
    updatedBy: adminId,
    version: 1,
    isCurrent: true,
  });
};

// Get All Plans
const getAllPlansService = async () => {
  return await findAllPlans();
};

// Get Public Plans
const getPublicPlansService = async () => {
  return await findPublicPlans();
};

// Get Plan By ID
const getPlanByIdService = async (id) => {
  const plan = await findPlanById(id);

  if (!plan) {
    throw new Error("Plan not found.");
  }

  return plan;
};

// Get Plan History
const getPlanHistoryService = async (slug) => {
  return await findPlanHistory(slug);
};

// Create New Version
const createPlanVersionService = async (
  id,
  updateData,
  adminId
) => {
  const currentPlan = await findPlanById(id);

  if (!currentPlan) {
    throw new Error("Plan not found.");
  }

  const features = updateData.features
    ? [...new Set(updateData.features)]
    : currentPlan.features;

  const newPlan = await createPlan({
    name: updateData.name ?? currentPlan.name,
    slug: currentPlan.slug,
    description: updateData.description ?? currentPlan.description,
    price: updateData.price ?? currentPlan.price,
    currency: updateData.currency ?? currentPlan.currency,
    billingCycle: updateData.billingCycle ?? currentPlan.billingCycle,
    durationDays: updateData.durationDays ?? currentPlan.durationDays,
    features,
    version: currentPlan.version + 1,
    parentPlanId: currentPlan.parentPlanId || currentPlan._id,
    effectiveFrom: new Date(),
    status: "active",
    visibility: updateData.visibility ?? currentPlan.visibility,
    isPopular: updateData.isPopular ?? currentPlan.isPopular,
    displayOrder: updateData.displayOrder ?? currentPlan.displayOrder,
    color: updateData.color ?? currentPlan.color,
    icon: updateData.icon ?? currentPlan.icon,
    createdBy: adminId,
    updatedBy: adminId,
    isCurrent: true,
  });

  await archiveCurrentPlan(currentPlan._id, newPlan._id);

  return await activatePlan(newPlan._id);
};

// Update Draft Plan
const updateDraftPlanService = async (
  id,
  updateData,
  adminId
) => {
  const plan = await findPlanById(id);

  if (!plan) {
    throw new Error("Plan not found.");
  }

  if (plan.status !== "draft") {
    throw new Error(
      "Only draft plans can be edited directly."
    );
  }

  if (updateData.features) {
    updateData.features = [...new Set(updateData.features)];
  }

  updateData.updatedBy = adminId;

  return await updateDraftPlan(id, updateData);
};

// Delete Draft Plan
const deletePlanService = async (id) => {
  const plan = await findPlanById(id);

  if (!plan) {
    throw new Error("Plan not found.");
  }

  if (plan.status !== "draft") {
    throw new Error(
      "Only draft plans can be deleted."
    );
  }

  await deletePlan(id);

  return {
    success: true,
    message: "Plan deleted successfully.",
  };
};

module.exports = {
  createPlanService,
  getAllPlansService,
  getPublicPlansService,
  getPlanByIdService,
  getPlanHistoryService,
  createPlanVersionService,
  updateDraftPlanService,
  deletePlanService,
};