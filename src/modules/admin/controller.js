const {
  getDashboardService,
   getUsersService,
   getUserByIdService,
    getPlansService,
    createPlanService,
    updatePlanService,
    updatePlanStatusService,
    getPlanByIdService,
    getSubscriptionsService,
    getSubscriptionByIdService,
} = require("./service");

// ======================================
// Dashboard
// ======================================

const getDashboard = async (req, res) => {
  try {
    const dashboard = await getDashboardService();

    return res.status(200).json({
      success: true,
      message: "Dashboard data fetched successfully.",
      data: dashboard,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================
// Get Users
// ======================================

const getUsers = async (req, res) => {
  try {
    const users = await getUsersService(req.query);

    return res.status(200).json({
      success: true,
      message: "Users fetched successfully.",
      data: users,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get User Details
// ======================================

const getUserById = async (req, res) => {
  try {
    const data = await getUserByIdService(req.params.id);

    return res.status(200).json({
      success: true,
      message: "User fetched successfully.",
      data,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

// Get Plans
// ======================================

const getPlans = async (req, res) => {
  try {
    const plans = await getPlansService();

    return res.status(200).json({
      success: true,
      message: "Plans fetched successfully.",
      data: plans,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Create Plan
// ======================================

const createPlan = async (req, res) => {
  try {
    const plan = await createPlanService(
      req.body,
      req.user.userId
    );

    return res.status(201).json({
      success: true,
      message: "Plan created successfully.",
      data: plan,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================
// Update Plan
// ======================================

const updatePlan = async (req, res) => {
  try {
    const plan = await updatePlanService(
      req.params.id,
      req.body,
      req.user.userId
    );

    return res.status(200).json({
      success: true,
      message: "New plan version created successfully.",
      data: plan,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================
// Update Plan Status
// ======================================

const updatePlanStatus = async (req, res) => {
  try {
    const plan = await updatePlanStatusService(
      req.params.id,
      req.body.status,
      req.user.userId
    );

    return res.status(200).json({
      success: true,
      message: "Plan status updated successfully.",
      data: plan,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================
// Get Plan Details
// ======================================

const getPlanById = async (
    req,
    res
) => {
    try {
        const data =
            await getPlanByIdService(
                req.params.id
            );

        return res.status(200).json({
            success: true,
            message:
                "Plan fetched successfully.",
            data,
        });
    } catch (error) {
        return res.status(404).json({
            success: false,
            message: error.message,
        });
    }
};

// ======================================
// Get Subscriptions
// ======================================

const getSubscriptions = async (
    req,
    res
) => {

    try {

        const data =
            await getSubscriptionsService(
                req.query
            );

        return res.status(200).json({

            success: true,

            message:
                "Subscriptions fetched successfully.",

            data,

        });

    } catch (error) {

        return res.status(500).json({

            success: false,

            message: error.message,

        });

    }

};

// ======================================
// Get Subscription Details
// ======================================

const getSubscriptionById = async (
  req,
  res
) => {
  try {
    const data =
      await getSubscriptionByIdService(
        req.params.id
      );

    return res.status(200).json({
      success: true,
      message:
        "Subscription fetched successfully.",
      data,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getDashboard,
    getUsers,
     getUserById,
     getPlans,
     createPlan,
     updatePlan,
      updatePlanStatus,
      getPlanById,
      getSubscriptions,
      getSubscriptionById,
};