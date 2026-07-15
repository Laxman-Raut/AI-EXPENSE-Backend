const express = require("express");

const { register, login, profile, update, forgotPassword, verifyOtp, resetPassword, support } = require("./controller");

const {
  validateRegister,
  validateLogin,
} = require("./middleware");

const authenticate = require("./auth.middleware");

const router = express.Router();

router.post("/register", validateRegister, register);

router.post("/login", validateLogin, login);

router.get("/me", authenticate, profile);
router.put("/profile", authenticate, update);
router.post("/support", authenticate, support);
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOtp);
router.post("/reset-password", resetPassword);

module.exports = router;