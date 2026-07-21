const express = require("express");

const {
  createPlan,
  getAllPlans,
  getPublicPlans,
  getPlanById,
  getPlanHistory,
  createPlanVersion,
  updateDraftPlan,
  removePlan,
} = require("./controller");

const {
  validateCreatePlan,
  validateUpdatePlan,
} = require("./validation");

const authenticate = require("../auth/auth.middleware");
const requireAdmin = require("../auth/requireAdmin");

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Public Routes (Mobile App)
|--------------------------------------------------------------------------
*/

router.get("/public", getPublicPlans);

/*
|--------------------------------------------------------------------------
| Admin Routes
|--------------------------------------------------------------------------
*/

router.post(
  "/",
  authenticate,
  requireAdmin,
  validateCreatePlan,
  createPlan
);

router.get(
  "/",
  authenticate,
  requireAdmin,
  getAllPlans
);

router.get(
  "/:id",
  authenticate,
  requireAdmin,
  getPlanById
);

router.get(
  "/history/:slug",
  authenticate,
  requireAdmin,
  getPlanHistory
);

router.put(
  "/draft/:id",
  authenticate,
  requireAdmin,
  validateUpdatePlan,
  updateDraftPlan
);

router.post(
  "/version/:id",
  authenticate,
  requireAdmin,
  validateUpdatePlan,
  createPlanVersion
);

router.delete(
  "/:id",
  authenticate,
  requireAdmin,
  removePlan
);

module.exports = router;