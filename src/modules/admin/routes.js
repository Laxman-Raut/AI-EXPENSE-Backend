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

router.get(
    "/subscriptions",
    authenticate,
    requireAdmin,
    getSubscriptions
);

router.get(
  "/subscriptions/:id",
  authenticate,
  requireAdmin,
  getSubscriptionById
);

module.exports = router;