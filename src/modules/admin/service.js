const {
    getTotalUsers,
    getVerifiedUsers,
    getPremiumUsers,
    getFreeUsers,
    getTotalRevenue,
    getTodayRevenue,
    getMonthlyRevenue,
    getTodayUsers,
    getMonthlyUsers,
    getLatestUsers,
    getLatestPayments,
    getActivePlans,
    getPendingPayments,
    getRevenueTrend,
    getUserGrowthTrend,
    getSubscriptionDistribution,
    getRevenueByPlan,
      getUsers,
      getUserById,
    getPlans,
    createPlan,
    updatePlan,
    updatePlanStatus,
    getPlanById,
    getSubscriptions,
    getSubscriptionById,
    activateSubscription,
    getSubscriptionTimeline,
    cancelSubscription,
    extendSubscription,
} = require("./repository");

// ======================================
// Dashboard
// ======================================

const getDashboardService = async () => {
    const [
        totalUsers,
        verifiedUsers,
        premiumUsers,
        freeUsers,

        totalRevenue,
        todayRevenue,
        monthlyRevenue,

        todayUsers,
        monthlyUsers,

        latestUsers,
        latestPayments,

        activePlans,
        pendingPayments,
        revenueTrend,
        userGrowthTrend,
        subscriptionDistribution,
        revenueByPlan,

    ] = await Promise.all([
        getTotalUsers(),
        getVerifiedUsers(),
        getPremiumUsers(),
        getFreeUsers(),

        getTotalRevenue(),
        getTodayRevenue(),
        getMonthlyRevenue(),

        getTodayUsers(),
        getMonthlyUsers(),

        getLatestUsers(),
        getLatestPayments(),

        getActivePlans(),
        getPendingPayments(),
        getRevenueTrend(),
        getUserGrowthTrend(),
        getSubscriptionDistribution(),
        getRevenueByPlan(),
    ]);

    return {
        cards: {
            users: {
                total: totalUsers,
                verified: verifiedUsers,
                premium: premiumUsers,
                free: freeUsers,
                today: todayUsers,
                monthly: monthlyUsers,
            },

            revenue: {
                total: totalRevenue,
                today: todayRevenue,
                monthly: monthlyRevenue,
            },

            plans: {
                active: activePlans,
            },

            payments: {
                pending: pendingPayments,
            },
        },

        charts: {
            revenueTrend,
            userGrowthTrend,
            subscriptionDistribution,
             revenueByPlan,
        },

        recentActivity: {
            latestUsers,
            latestPayments,
        },
    };
};

// ======================================
// Get Users
// ======================================

const getUsersService = async (query) => {
  const {
    page = 1,
    limit = 10,
    search = "",
    plan,
    status,
    sort = "-createdAt",
  } = query;

  return await getUsers({
    page: Number(page),
    limit: Number(limit),
    search,
    plan,
    status,
    sort,
  });
};


// Get User Details

const getUserByIdService = async (userId) => {
  return await getUserById(userId);
};

// Get Plans
// ======================================

const getPlansService = async () => {
  return await getPlans();
};

// Create Plan
// ======================================

const createPlanService = async (planData, adminId) => {
  return await createPlan({
    ...planData,
    createdBy: adminId,
    updatedBy: adminId,
  });
};

// ======================================
// Update Plan
// ======================================

const updatePlanService = async (
  planId,
  updateData,
  adminId
) => {
  return await updatePlan(
    planId,
    updateData,
    adminId
  );
};


// ======================================
// Update Plan Status
// ======================================

const updatePlanStatusService = async (
  planId,
  status,
  adminId
) => {
  return await updatePlanStatus(
    planId,
    status,
    adminId
  );
};


// Get Plan Details
// ======================================

const getPlanByIdService = async (
    planId
) => {
    return await getPlanById(planId);
};


// ======================================
// Get All Subscriptions
// ======================================

const getSubscriptionsService = async (
    query
) => {

    return await getSubscriptions(query);

};

// ======================================
// Get Subscription Details
// ======================================

const getSubscriptionByIdService = async (
  userId
) => {
  return await getSubscriptionById(userId);
};

// ======================================
// Activate Subscription
// ======================================

const activateSubscriptionService = async (
    userId,
    body,
    adminId
) => {

    return await activateSubscription(
        userId,
        body.planId,
        adminId
    );

};

const getSubscriptionTimelineService =
async (userId) => {

    return await getSubscriptionTimeline(
        userId
    );

};

// ======================================
// Cancel Subscription
// ======================================

const cancelSubscriptionService = async (
  userId,
  adminId
) => {
  return await cancelSubscription(
    userId,
    adminId
  );
};

// ======================================
// Extend Subscription
// ======================================

const extendSubscriptionService = async (
  userId,
  body,
  adminId
) => {
  return await extendSubscription(
    userId,
    body.durationDays,
    body.note,
    adminId
  );
};

module.exports = {
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
    activateSubscriptionService,
    getSubscriptionTimelineService,
    cancelSubscriptionService,
    extendSubscriptionService,
};