const express = require("express");

const authenticate = require("../auth/auth.middleware");
const requireAdmin = require("../auth/requireAdmin");
const {
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
   updateCampaignStatusCtrl,
   deleteCampaignCtrl,
   getAdminSystemNotificationsCtrl,
   markAdminNotificationReadCtrl,
   deleteAdminNotificationCtrl,
   clearAdminNotificationsCtrl,
   getAdminSupportQueriesCtrl,
   updateSupportQueryStatusCtrl,
   replySupportQueryCtrl,
} = require("./controller");

const {
  getReportsSummary,
  getRevenueReportCtrl,
  getUserReportCtrl,
  getSubscriptionReportCtrl,
  getPaymentReportCtrl,
} = require("./reports.controller");

const {
  createCouponCtrl,
  getAllCouponsCtrl,
  getCouponByIdCtrl,
  updateCouponCtrl,
  toggleCouponStatusCtrl,
  deleteCouponCtrl,
  getCouponStatsCtrl,
} = require("../coupon/controller");



const router = express.Router();


// ======================================
// Dashboard
// ======================================

router.get(
  "/dashboard",
  authenticate,
  requireAdmin,
  getDashboard
);

router.get(
  "/settings",
  authenticate,
  requireAdmin,
  getSystemSettingsCtrl
);

router.put(
  "/settings",
  authenticate,
  requireAdmin,
  updateSystemSettingsCtrl
);


// Users


router.get(
  "/users",
  authenticate,
  requireAdmin,
  getUsers
);

router.get(
  "/users/:id",
  authenticate,
  requireAdmin,
  getUserById
);

// Toggle user account status (active ↔ suspended)
router.patch(
  "/users/:id/status",
  authenticate,
  requireAdmin,
  toggleUserStatus
);

// Admin-initiated user password reset link dispatch
router.post(
  "/users/:id/reset-password",
  authenticate,
  requireAdmin,
  resetUserPassword
);

// Plans
// ======================================

router.get(
  "/plans",
  authenticate,
  requireAdmin,
  getPlans
);

router.post(
  "/plans",
  authenticate,
  requireAdmin,
  createPlan
);

router.put(
  "/plans/:id",
  authenticate,
  requireAdmin,
  updatePlan
);

router.patch(
    "/plans/:id/status",
    authenticate,
    requireAdmin,
    updatePlanStatus
);

router.get(
    "/plans/:id",
    authenticate,
    requireAdmin,
    getPlanById
);

// Delete pricing plan tier
router.delete(
    "/plans/:id",
    authenticate,
    requireAdmin,
    deletePlan
);

// Configure plan limits & grace boundaries
router.post(
    "/plans/:id/limits",
    authenticate,
    requireAdmin,
    updatePlanLimits
);

router.get(
    "/subscriptions",
    authenticate,
    requireAdmin,
    getSubscriptions
);

// IMPORTANT: /subscriptions/metrics MUST be declared before /subscriptions/:id
router.get(
  "/subscriptions/metrics",
  authenticate,
  requireAdmin,
  getSubscriptionMetrics
);

router.get(
  "/subscriptions/:id",
  authenticate,
  requireAdmin,
  getSubscriptionById
);

router.patch(
    "/subscriptions/:id/activate",
    authenticate,
    requireAdmin,
    activateSubscription
);

router.get(
    "/subscriptions/:id/timeline",
    authenticate,
    requireAdmin,
    getSubscriptionTimeline
);

router.patch(
  "/subscriptions/:id/cancel",
  authenticate,
  requireAdmin,
  cancelSubscription
);

router.patch(
  "/subscriptions/:id/extend",
  authenticate,
  requireAdmin,
  extendSubscription
);


// ======================================
// Payments Ledger
// ======================================

router.get(
  "/payments",
  authenticate,
  requireAdmin,
  getAdminPayments
);

// ======================================
// AI Usage Stats
// ======================================

router.get(
  "/ai-usage",
  authenticate,
  requireAdmin,
  getAiUsageStats
);

// ======================================
// Coupons Management
// ======================================

router.get("/coupons", authenticate, requireAdmin, getAllCouponsCtrl);
router.post("/coupons", authenticate, requireAdmin, createCouponCtrl);
router.get("/coupons/stats", authenticate, requireAdmin, getCouponStatsCtrl);
router.get("/coupons/:id", authenticate, requireAdmin, getCouponByIdCtrl);
router.put("/coupons/:id", authenticate, requireAdmin, updateCouponCtrl);
router.patch("/coupons/:id/status", authenticate, requireAdmin, toggleCouponStatusCtrl);
router.delete("/coupons/:id", authenticate, requireAdmin, deleteCouponCtrl);


// ======================================
// Reports
// ======================================

// IMPORTANT: /reports/summary, /reports/revenue etc. MUST be declared before any :id routes
router.get(
  "/reports/summary",
  authenticate,
  requireAdmin,
  getReportsSummary
);

router.get(
  "/reports/revenue",
  authenticate,
  requireAdmin,
  getRevenueReportCtrl
);

router.get(
  "/reports/users",
  authenticate,
  requireAdmin,
  getUserReportCtrl
);

router.get(
  "/reports/subscriptions",
  authenticate,
  requireAdmin,
  getSubscriptionReportCtrl
);

router.get(
  "/reports/payments",
  authenticate,
  requireAdmin,
  getPaymentReportCtrl
);

router.get(
  "/notifications/audience-count",
  authenticate,
  requireAdmin,
  getSegmentAudienceCountCtrl
);

router.post(
  "/notifications/broadcast",
  authenticate,
  requireAdmin,
  sendAdminBroadcastCtrl
);

router.get(
  "/notifications/campaigns",
  authenticate,
  requireAdmin,
  getAdminCampaignsCtrl
);

router.patch(
  "/notifications/campaigns/:id/status",
  authenticate,
  requireAdmin,
  updateCampaignStatusCtrl
);

router.delete(
  "/notifications/campaigns/:id",
  authenticate,
  requireAdmin,
  deleteCampaignCtrl
);

router.get(
  "/notifications",
  authenticate,
  requireAdmin,
  getAdminSystemNotificationsCtrl
);

router.patch(
  "/notifications/:id/read",
  authenticate,
  requireAdmin,
  markAdminNotificationReadCtrl
);

router.delete(
  "/notifications/:id",
  authenticate,
  requireAdmin,
  deleteAdminNotificationCtrl
);

router.delete(
  "/notifications",
  authenticate,
  requireAdmin,
  clearAdminNotificationsCtrl
);

// Support Queries
router.get(
  "/support-queries",
  authenticate,
  requireAdmin,
  getAdminSupportQueriesCtrl
);

router.patch(
  "/support-queries/:id/status",
  authenticate,
  requireAdmin,
  updateSupportQueryStatusCtrl
);

router.post(
  "/support-queries/:id/reply",
  authenticate,
  requireAdmin,
  replySupportQueryCtrl
);

module.exports = router;