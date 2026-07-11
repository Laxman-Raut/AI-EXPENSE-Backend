const express = require("express");
const { scanReceiptController } = require("./controller");
const authenticate = require("../auth/auth.middleware");
const upload = require("../upload/upload.middleware");

const router = express.Router();

router.post(
  "/scan-receipt",
  authenticate,
  upload.single("image"),
  scanReceiptController
);

module.exports = router;
