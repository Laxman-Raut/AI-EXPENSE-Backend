const express = require("express");
const {
  refreshTokenCtrl,
  logoutCtrl,
  register,
  sendRegistrationOtp,
  completeRegistration,
  verifyRegistrationOtp,
  resendVerificationOtp,
  login,
  googleLogin,
  profile,
  update,
  forgotPassword,
  verifyOtp,
  resetPassword,
  support,
  searchUsers,
  updateFcmToken,
  clearFcmToken,
} = require("./controller");

const {
  validateRegister,
  validateLogin,
} = require("./middleware");

const authenticate = require("./auth.middleware");

const router = express.Router();

router.post("/register", register);
router.post("/send-registration-otp", sendRegistrationOtp);
router.post("/verify-registration-otp", verifyRegistrationOtp);
router.post("/resend-registration-otp", resendVerificationOtp);
router.post("/complete-registration", completeRegistration);

router.post("/login", validateLogin, login);
router.post("/refresh-token", refreshTokenCtrl);
router.post("/logout", authenticate, logoutCtrl);
router.post("/google", googleLogin);

router.get("/me", authenticate, profile);
router.put("/profile", authenticate, update);
router.post("/support", authenticate, support);

router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOtp);
router.post("/reset-password", resetPassword);
router.get("/search", authenticate, searchUsers);

// FCM Push Notification Token
router.put("/fcm-token", authenticate, updateFcmToken);
router.delete("/fcm-token", authenticate, clearFcmToken);

module.exports = router;