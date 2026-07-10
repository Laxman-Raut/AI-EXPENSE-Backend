const express = require("express");
const upload = require("./upload.middleware");
const { uploadImage } = require("./controller");
const authenticate = require("../auth/auth.middleware");

const router = express.Router();

router.post(
  "/",
  authenticate,
  upload.single("image"),
  uploadImage
);

module.exports = router;