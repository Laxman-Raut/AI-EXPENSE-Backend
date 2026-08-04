const express = require("express");

const router = express.Router();

const controller = require("./controller");

const {
  validateCreateBank,
  validateUpdateBank,
} = require("./middleware");

const authMiddleware = require("../auth/auth.middleware");

// Create Bank
router.post(
  "/",
  authMiddleware,
  validateCreateBank,
  controller.createBank
);

// Get All Banks
router.get(
  "/",
  authMiddleware,
  controller.getBanks
);

// Get Single Bank
router.get(
  "/:id",
  authMiddleware,
  controller.getBankById
);

// Update Bank
router.patch(
  "/:id",
  authMiddleware,
  validateUpdateBank,
  controller.updateBank
);

// Delete Bank
router.delete(
  "/:id",
  authMiddleware,
  controller.deleteBank
);

// Set Primary Bank
router.patch(
  "/:id/primary",
  authMiddleware,
  controller.setPrimaryBank
);

module.exports = router;