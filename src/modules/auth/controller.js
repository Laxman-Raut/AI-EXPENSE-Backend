const { 
  registerUser,
  verifyRegistrationOtp: verifyRegistrationOtpService,
  resendVerificationOtp: resendVerificationOtpService,
  loginUser,
  googleLoginUser,
  getProfile,
  updateProfile,
  forgotPassword: forgotPasswordService,
  verifyOtp: verifyOtpService,
  resetPassword: resetPasswordService,
  handleSupportRequest,
} = require("./service");

const sendRegistrationOtpController = async (req, res) => {
  try {
    const { fullName, email } = req.body;
    const result = await authService.sendRegistrationOtp({ fullName, email });
    res.status(200).json({
      success: true,
      message: result.message,
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const completeRegistrationController = async (req, res) => {
  try {
    const { fullName, email, otp, password } = req.body;
    const result = await authService.completeRegistration({ fullName, email, otp, password });
    res.status(201).json({
      success: true,
      message: "Registration completed successfully.",
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const register = async (req, res) => {
  try {
    const user = await registerUser(req.body);

    res.status(201).json({
      success: true,
      message: "Verification OTP sent successfully",
      data: user,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};



const login = async (req, res) => {
  try {
    const result = await loginUser(req.body);

    res.status(200).json({
      success: true,
      message: "Login API working",
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
      requiresVerification: error.requiresVerification || false,
      email: error.email || undefined,
    });
  }
};

const googleLogin = async (req, res) => {
  try {
    const result = await googleLoginUser(req.body);

    res.status(200).json({
      success: true,
      message: "Google login successful",
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const profile = async (req, res) => {
  try {
    const user = await getProfile(req.user.userId);

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const update = async (req, res) => {
  try {
    const user = await updateProfile(req.user.userId, req.body);

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: user,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const result = await forgotPasswordService(email);

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const result = await verifyOtpService(email, otp);

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const result = await resetPasswordService(email, otp, newPassword);

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const support = async (req, res) => {
  try {
    const { subject, message } = req.body;
    if (!subject || !message) {
      throw new Error("Subject and message are required");
    }
    const result = await handleSupportRequest(req.user.userId, { subject, message });

    res.status(200).json({
      success: true,
      message: "Support ticket submitted successfully",
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
const authService = require("./service");
const User = require("./model");

// Update FCM Token for Push Notifications
const updateFcmToken = async (req, res) => {
  try {
    const { fcmToken } = req.body;

    if (!fcmToken || typeof fcmToken !== "string") {
      return res.status(400).json({
        success: false,
        message: "Valid FCM token is required.",
      });
    }

    await User.findByIdAndUpdate(req.user.userId, { fcmToken: fcmToken.trim() });

    return res.status(200).json({
      success: true,
      message: "FCM token updated successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Clear FCM Token (on logout)
const clearFcmToken = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.userId, { fcmToken: "" });

    return res.status(200).json({
      success: true,
      message: "FCM token cleared successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const verifyRegistrationOtpController = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const result = await verifyRegistrationOtpService({ email, otp });

    return res.status(200).json({
      success: true,
      message: "Email verified successfully.",
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const resendVerificationOtpController = async (req, res) => {
  try {
    const { email } = req.body;
    const result = await resendVerificationOtpService({ email });

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const searchUsers = async (req, res, next) => {
  try {
    const searchTerm = req.query.q || req.query.query || "";
    const currentUserId = req.user?.id || req.user?.userId || req.user?._id;
    const users = await authService.searchUsers(searchTerm, currentUserId);

    return res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  sendRegistrationOtp: sendRegistrationOtpController,
  completeRegistration: completeRegistrationController,
  verifyRegistrationOtp: verifyRegistrationOtpController,
  resendVerificationOtp: resendVerificationOtpController,
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
};