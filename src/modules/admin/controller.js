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
    activateSubscriptionService,
    getSubscriptionTimelineService,
    cancelSubscriptionService,
    extendSubscriptionService,
    getAdminPaymentsService,
    getAiUsageStatsService,
    getSubscriptionMetricsService,
    toggleUserStatusService,
    initiateUserPasswordResetService,
    deletePlanByIdService,
    updatePlanLimitsService,
    getSystemSettingsService,
    updateSystemSettingsService,
    getSegmentAudienceCountService,
    sendAdminBroadcastService,
    getAdminCampaignsService,
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

// ======================================
// Activate Subscription
// ======================================

const activateSubscription = async (
    req,
    res
) => {

    try {

        const data =
            await activateSubscriptionService(
                req.params.id,
                req.body,
                req.user.userId
            );

        return res.status(200).json({

            success: true,

            message:
                "Subscription activated successfully.",

            data,

        });

    } catch (error) {

        return res.status(400).json({

            success: false,

            message: error.message,

        });

    }

};

const getSubscriptionTimeline =
async (req, res) => {

    try {

        const data =
            await getSubscriptionTimelineService(
                req.params.id
            );

        return res.json({
            success: true,
            data,
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message,
        });

    }

};

// ======================================
// Cancel Subscription
// ======================================

const cancelSubscription = async (
  req,
  res
) => {
  try {
    const data =
      await cancelSubscriptionService(
        req.params.id,
        req.user.userId
      );

    return res.status(200).json({
      success: true,
      message: "Subscription cancelled successfully.",
      data,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================
// Extend Subscription
// ======================================

const extendSubscription = async (
    req,
    res
) => {
    try {
        const data =
            await extendSubscriptionService(
                req.params.id,
                req.body,
                req.user.userId
            );

        return res.status(200).json({
            success: true,
            message:
                "Subscription extended successfully.",
            data,
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

// ======================================
// Admin Payments Ledger
// ======================================

const getAdminPayments = async (req, res) => {
  try {
    const data = await getAdminPaymentsService(req.query);

    return res.status(200).json({
      success: true,
      message: "Payments fetched successfully.",
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
// Admin AI Usage Stats
// ======================================

const getAiUsageStats = async (req, res) => {
  try {
    const data = await getAiUsageStatsService(req.query);

    return res.status(200).json({
      success: true,
      message: "AI usage stats fetched successfully.",
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
// Subscription SaaS Metrics
// ======================================

const getSubscriptionMetrics = async (req, res) => {
  try {
    const data = await getSubscriptionMetricsService();

    return res.status(200).json({
      success: true,
      message: "Subscription metrics fetched successfully.",
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
// Toggle User Account Status
// ======================================

const toggleUserStatus = async (req, res) => {
  try {
    const data = await toggleUserStatusService(req.params.id);

    return res.status(200).json({
      success: true,
      message: `User account ${data.accountStatus === 'suspended' ? 'suspended' : 'activated'} successfully.`,
      data,
    });
  } catch (error) {
    return res.status(error.message.includes('not found') ? 404 : 400).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================
// Reset User Password
// ======================================

const resetUserPassword = async (req, res) => {
  try {
    const data = await initiateUserPasswordResetService(req.params.id);

    return res.status(200).json({
      success: true,
      message: data.message,
      data,
    });
  } catch (error) {
    return res.status(error.message.includes('not found') ? 404 : 400).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================
// Delete Plan
// ======================================

const deletePlan = async (req, res) => {
  try {
    const data = await deletePlanByIdService(req.params.id);

    return res.status(200).json({
      success: true,
      message: data.message,
      data,
    });
  } catch (error) {
    return res.status(error.message.includes('not found') ? 404 : 400).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================
// Update Plan Limits
// ======================================

const updatePlanLimits = async (req, res) => {
  try {
    const data = await updatePlanLimitsService(req.params.id, req.body);

    return res.status(200).json({
      success: true,
      message: "Plan limits updated successfully.",
      data,
    });
  } catch (error) {
    return res.status(error.message.includes('not found') ? 404 : 400).json({
      success: false,
      message: error.message,
    });
  }
};

const getSystemSettingsCtrl = async (req, res) => {
  try {
    const data = await getSystemSettingsService();
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updateSystemSettingsCtrl = async (req, res) => {
  try {
    const data = await updateSystemSettingsService(req.body);
    return res.status(200).json({
      success: true,
      message: "System settings updated successfully.",
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getSegmentAudienceCountCtrl = async (req, res) => {
  try {
    const { segment = 'all', email = '' } = req.query;
    const count = await getSegmentAudienceCountService(segment, email);
    return res.status(200).json({
      success: true,
      data: { audienceCount: count }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const sendAdminBroadcastCtrl = async (req, res) => {
  try {
    const { title, body, type, category, targetSegment, segment, specificEmail, email } = req.body;

    if (!title || !body) {
      return res.status(400).json({
        success: false,
        message: "Title and body are required for campaign broadcast."
      });
    }

    const resolvedType = type || category || "system";
    const resolvedSegment = targetSegment || segment || "all";
    const resolvedEmail = specificEmail || email || "";

    const result = await sendAdminBroadcastService(
      { title, body, type: resolvedType, targetSegment: resolvedSegment, specificEmail: resolvedEmail },
      req.user.userId
    );

    return res.status(200).json({
      success: true,
      message: `Notification broadcast sent successfully to ${result.recipientCount} user(s).`,
      data: result
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const getAdminCampaignsCtrl = async (req, res) => {
  try {
    const campaigns = await getAdminCampaignsService();
    return res.status(200).json({
      success: true,
      data: campaigns
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const { 
  getUserNotifications, 
  markAsRead: markNotifRead, 
  deleteNotification: deleteNotif, 
  clearAllNotifications: clearNotifs 
} = require("../notification/service");

const getAdminSystemNotificationsCtrl = async (req, res) => {
  try {
    const notifications = await getUserNotifications(req.user.userId);
    return res.status(200).json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const markAdminNotificationReadCtrl = async (req, res) => {
  try {
    const notification = await markNotifRead(req.params.id);
    return res.status(200).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteAdminNotificationCtrl = async (req, res) => {
  try {
    await deleteNotif(req.params.id);
    return res.status(200).json({
      success: true,
      message: "Notification deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const clearAdminNotificationsCtrl = async (req, res) => {
  try {
    await clearNotifs(req.user.userId);
    return res.status(200).json({
      success: true,
      message: "All notifications cleared.",
    });
  } catch (error) {
    return res.status(500).json({
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
      activateSubscription,
      getSubscriptionTimeline,
      cancelSubscription,
      extendSubscription,
      getAdminPayments,
      getAiUsageStats,
      getSubscriptionMetrics,
      toggleUserStatus,
      resetUserPassword,
      deletePlan,
      updatePlanLimits,
      getSystemSettingsCtrl,
      updateSystemSettingsCtrl,
      getSegmentAudienceCountCtrl,
      sendAdminBroadcastCtrl,
      getAdminCampaignsCtrl,
      getAdminSystemNotificationsCtrl,
      markAdminNotificationReadCtrl,
      deleteAdminNotificationCtrl,
      clearAdminNotificationsCtrl,
};