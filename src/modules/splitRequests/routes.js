const express = require("express");

const authenticate = require("../auth/auth.middleware");

const {
  createSplitRequest,
  getGroupSplitRequests,
  getSplitRequestById,
  updateSplitRequest,
  deleteSplitRequest,
} = require("./controller");

const {
  validateCreateSplitRequest,
} = require("./validation");

const router = express.Router();

// Create Split Request
router.post(
  "/",
  authenticate,
  validateCreateSplitRequest,
  createSplitRequest
);

// Get All Split Requests of a Group
router.get(
  "/group/:groupId",
  authenticate,
  getGroupSplitRequests
);

// Get Single Split Request
router.get(
  "/:splitId",
  authenticate,
  getSplitRequestById
);

// Update Split Request
router.put(
  "/:splitId",
  authenticate,
  updateSplitRequest
);

// Delete Split Request
router.delete(
  "/:splitId",
  authenticate,
  deleteSplitRequest
);

module.exports = router;