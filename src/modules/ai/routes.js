const express = require("express");
const router = express.Router();

const authenticate = require("../auth/auth.middleware");
const upload = require("../upload/upload.middleware");

const { scanReceiptController } = require("./controller");

router.post(
    "/scan-receipt",
    authenticate,
    upload.single("image"),
    scanReceiptController
);

module.exports = router;