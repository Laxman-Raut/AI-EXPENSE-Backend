const { 
  generateTokenPair,
  refreshAccessToken,
  revokeRefreshToken,
  revokeAllUserTokens,
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
    const { fullName, email, role } = req.body;
    const result = await authService.sendRegistrationOtp({ fullName, email, role });
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
    const { fullName, email, otp, password, role } = req.body;
    const result = await authService.completeRegistration({ fullName, email, otp, password, role });
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
    const isDashboard = req.headers["x-client-type"] === "dashboard";

    if (isDashboard) {
      // Dashboard: Generate short-lived access + refresh token pair, set as HttpOnly cookies
      const tokenPair = await generateTokenPair(
        result.user,
        req.headers["user-agent"] || ""
      );

      const isProduction = process.env.NODE_ENV === "production";

      // Set access token cookie (15 minutes)
      res.cookie("access_token", tokenPair.accessToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        maxAge: tokenPair.accessTokenExpiresIn,
        path: "/",
      });

      // Set refresh token cookie (30 days, restricted path)
      res.cookie("refresh_token", tokenPair.refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        maxAge: tokenPair.refreshTokenExpiresIn,
        path: "/api",
      });

      return res.status(200).json({
        success: true,
        message: "Login Successful",
        data: {
          user: result.user,
          token: tokenPair.accessToken,
          refreshToken: tokenPair.refreshToken,
        },
      });
    }

    // Mobile App: Return token in body only (no cookies)
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

// Refresh Token Controller — issues new token pair from body or cookie
const refreshTokenCtrl = async (req, res) => {
  try {
    // Accept from body (token-based/cross-domain) or cookie (same-domain)
    const rawRefreshToken = req.body?.refreshToken || req.cookies?.refresh_token;

    if (!rawRefreshToken) {
      return res.status(401).json({
        success: false,
        message: "No refresh token provided.",
      });
    }

    const result = await refreshAccessToken(
      rawRefreshToken,
      req.headers["user-agent"] || ""
    );

    const isProduction = process.env.NODE_ENV === "production";

    // Set new access token cookie (for same-domain setups)
    res.cookie("access_token", result.accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: result.accessTokenExpiresIn,
      path: "/",
    });

    // Set new refresh token cookie (rotation)
    res.cookie("refresh_token", result.refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: result.refreshTokenExpiresIn,
      path: "/api",
    });

    return res.status(200).json({
      success: true,
      message: "Token refreshed successfully.",
      data: {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      },
    });
  } catch (error) {
    // Clear cookies on refresh failure
    res.clearCookie("access_token", { path: "/" });
    res.clearCookie("refresh_token", { path: "/api" });

    return res.status(401).json({
      success: false,
      message: error.message || "Failed to refresh token.",
    });
  }
};

// Logout Controller — revokes refresh token and clears cookies
const logoutCtrl = async (req, res) => {
  try {
    const rawRefreshToken = req.cookies?.refresh_token;

    if (rawRefreshToken) {
      await revokeRefreshToken(rawRefreshToken);
    }

    // Clear both cookies
    res.clearCookie("access_token", { path: "/" });
    res.clearCookie("refresh_token", { path: "/api" });

    return res.status(200).json({
      success: true,
      message: "Logged out successfully.",
    });
  } catch (error) {
    // Even on error, clear cookies
    res.clearCookie("access_token", { path: "/" });
    res.clearCookie("refresh_token", { path: "/api" });

    return res.status(200).json({
      success: true,
      message: "Logged out.",
    });
  }
};

module.exports = {
  refreshTokenCtrl,
  logoutCtrl,
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