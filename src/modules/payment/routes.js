const express = require("express");

const authenticate = require("../auth/auth.middleware");
const { createPaymentOrder } = require("./controller");

const router = express.Router();

router.post(
  "/create-order",
  authenticate,
  createPaymentOrder
);

module.exports = router;