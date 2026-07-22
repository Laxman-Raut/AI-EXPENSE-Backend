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
} = require("./controller");


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

module.exports = router;