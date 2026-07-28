const express = require("express");

const router = express.Router();

const authenticate = require("../auth/auth.middleware");
const upiController = require("./controller");
const {
  validateGenerateDeepLink,
} = require("./validation");

// Generate UPI Deep Link
router.post(
  "/deeplink",
  authenticate,
  validateGenerateDeepLink,
  upiController.generateDeepLink
);

module.exports = router;