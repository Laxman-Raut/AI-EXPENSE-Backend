const express = require("express");

const authenticate = require("../auth/auth.middleware");

const {
  getCurrentSubscription,
  upgrade,
  cancel,
  status,
  getTimeline,
} = require("./controller");

const router = express.Router();

router.get("/", authenticate, getCurrentSubscription);

router.patch("/upgrade", authenticate, upgrade);

router.patch("/cancel", authenticate, cancel);

router.get("/status", authenticate, status);

router.get("/timeline", authenticate, getTimeline);

module.exports = router;