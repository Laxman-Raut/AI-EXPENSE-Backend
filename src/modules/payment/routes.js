const express = require("express");

const authenticate = require("../auth/auth.middleware");
const { createPaymentOrder,
      verifyPaymentController,
      paymentDetails,
        } = require("./controller");

const router = express.Router();

router.post(
  "/create-order",
  authenticate,
  createPaymentOrder
);

router.post(
    "/verify",
    authenticate,
    verifyPaymentController,
);

router.get(
  "/:id",
  authenticate,
  paymentDetails
);

module.exports = router;