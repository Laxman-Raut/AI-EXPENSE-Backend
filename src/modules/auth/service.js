const User = require("./model");
const SupportQuery = require("../support/model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { sendOtpEmail, sendSupportEmail, sendWelcomeEmail, sendVerificationOtpEmail } = require("../email");
const RefreshToken = require("./refreshToken.model");
const generateOTP = require("./otp");
const Plan = require("../plan/model");
const SubscriptionHistory = require("../subscription-history/model");
const authRepository = require("./repository");
// Step 1: Send OTP to Email (Name + Email)
const sendRegistrationOtp = async ({ fullName, email, role }) => {
  const cleanEmail = email ? email.toLowerCase().trim() : "";
  const cleanName = fullName ? fullName.trim() : "";
  const requestedRole = (role && ["user", "admin", "super_admin"].includes(role)) ? role : "user";

  if (requestedRole === "super_admin") {
    const existingSuperAdmin = await User.findOne({ role: "super_admin", email: { $ne: cleanEmail } });
    if (existingSuperAdmin) {
      throw new Error("A Super Admin account already exists. Only one Super Admin is allowed.");
    }
  }

  if (!cleanName || cleanName.length < 3) {
    throw new Error("Full name must be at least 3 characters.");
  }
  if (!cleanEmail || !cleanEmail.includes("@")) {
    throw new Error("Please enter a valid email address.");
  }

  let existingUser = await User.findOne({ email: cleanEmail });

  if (existingUser && existingUser.isVerified) {
    throw new Error("Email is already registered. Please log in.");
  }

  const otp = generateOTP();
  const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

  if (existingUser) {
    existingUser.fullName = cleanName;
    if (role) existingUser.role = requestedRole;
    existingUser.verificationOtp = otp;
    existingUser.verificationOtpExpiry = expiry;
    await existingUser.save();
  } else {
    const dummyHash = await bcrypt.hash(crypto.randomBytes(16).toString("hex"), 10);
    await User.create({
      fullName: cleanName,
      email: cleanEmail,
      password: dummyHash,
      role: requestedRole,
      isVerified: false,
      verificationOtp: otp,
      verificationOtpExpiry: expiry,
    });
  }

  sendVerificationOtpEmail(cleanEmail, cleanName, otp).catch((err) => {
    console.warn("[Email Service] Verification OTP email warning:", err.message);
  });

  return {
    success: true,
    message: "Verification OTP sent to your email.",
    email: cleanEmail,
  };
};

// Step 3: Complete Registration (Set Password + Finalize)
const completeRegistration = async ({ fullName, email, otp, password, role }) => {
  const cleanEmail = email ? email.toLowerCase().trim() : "";
  const cleanOtp = otp ? otp.toString().trim() : "";

  if (!password || password.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }

  const user = await User.findOne({ email: cleanEmail });
  if (!user) {
    throw new Error("User not found. Please start registration again.");
  }

  if (user.isVerified) {
    throw new Error("Account is already registered and verified. Please log in.");
  }

  if (!user.verificationOtp || user.verificationOtp !== cleanOtp) {
    throw new Error("Invalid verification code.");
  }

  if (!user.verificationOtpExpiry || user.verificationOtpExpiry < new Date()) {
    throw new Error("Verification code has expired. Please request a new code.");
  }

  const targetRole = (role && ["user", "admin", "super_admin"].includes(role)) ? role : user.role;
  if (targetRole === "super_admin") {
    const existingSuperAdmin = await User.findOne({ role: "super_admin", _id: { $ne: user._id } });
    if (existingSuperAdmin) {
      throw new Error("A Super Admin account already exists. Only one Super Admin is allowed.");
    }
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  user.fullName = fullName ? fullName.trim() : user.fullName;
  user.password = hashedPassword;
  user.role = targetRole || "user";
  user.isVerified = true;
  user.verificationOtp = null;
  user.verificationOtpExpiry = null;
  user.lastVisitedAt = new Date();
  await user.save();

  try {
    const freePlan = await Plan.findOne({ slug: "free", isCurrent: true }) || await Plan.findOne({ slug: "free" });
    if (freePlan) {
      await SubscriptionHistory.create({
        userId: user._id,
        planId: freePlan._id,
        action: "activated",
        provider: "system",
        startDate: user.createdAt || new Date(),
        endDate: null,
        amount: 0,
        currency: freePlan.currency || "INR",
        note: "Initial user registration on Free plan.",
      });
    }
  } catch (historyErr) {
    console.warn("[Auth Service] Failed to create initial SubscriptionHistory:", historyErr.message);
  }

  sendWelcomeEmail(cleanEmail, user.fullName).catch((err) => {
    console.warn("[Email Service] Welcome email send warning:", err.message);
  });

  const token = jwt.sign(
    { userId: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  const userObject = user.toObject();
  delete userObject.password;

  return { token, user: userObject };
};

const registerUser = async (userData) => {
  const { fullName, email, password, role } = userData;
  return sendRegistrationOtp({ fullName, email, role });
};

const verifyRegistrationOtp = async ({ email, otp }) => {
  const cleanEmail = email ? email.toLowerCase().trim() : "";
  const cleanOtp = otp ? otp.toString().trim() : "";

  const user = await User.findOne({ email: cleanEmail });

  if (!user) {
    throw new Error("User not found.");
  }

  if (user.isVerified) {
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    const userObj = user.toObject();
    delete userObj.password;
    return { token, user: userObj };
  }

  if (!user.verificationOtp || user.verificationOtp !== cleanOtp) {
    throw new Error("Invalid verification code.");
  }

  if (!user.verificationOtpExpiry || user.verificationOtpExpiry < new Date()) {
    throw new Error("Verification code has expired. Please request a new code.");
  }

  // Mark verified & clear OTP fields
  user.isVerified = true;
  user.verificationOtp = null;
  user.verificationOtpExpiry = null;
  user.lastVisitedAt = new Date();
  await user.save();

  // Record initial free plan subscription history
  try {
    const freePlan = await Plan.findOne({ slug: "free", isCurrent: true }) || await Plan.findOne({ slug: "free" });
    if (freePlan) {
      await SubscriptionHistory.create({
        userId: user._id,
        planId: freePlan._id,
        action: "activated",
        provider: "system",
        startDate: user.createdAt || new Date(),
        endDate: null,
        amount: 0,
        currency: freePlan.currency || "INR",
        note: "Initial user registration on Free plan.",
      });
    }
  } catch (historyErr) {
    console.warn("[Auth Service] Failed to create initial SubscriptionHistory:", historyErr.message);
  }

  // Send welcome email
  sendWelcomeEmail(cleanEmail, user.fullName).catch((err) => {
    console.warn("[Email Service] Welcome email send warning:", err.message);
  });

  // Generate JWT token
  const token = jwt.sign(
    { userId: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  const userObject = user.toObject();
  delete userObject.password;

  return { token, user: userObject };
};

const resendVerificationOtp = async ({ email }) => {
  const cleanEmail = email ? email.toLowerCase().trim() : "";
  const user = await User.findOne({ email: cleanEmail });

  if (!user) {
    throw new Error("User not found.");
  }

  if (user.isVerified) {
    throw new Error("Your account is already verified.");
  }

  const otp = generateOTP();
  const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

  user.verificationOtp = otp;
  user.verificationOtpExpiry = expiry;
  await user.save();

  sendVerificationOtpEmail(cleanEmail, user.fullName, otp).catch((err) => {
    console.warn("[Email Service] Resend verification OTP warning:", err.message);
  });

  return {
    success: true,
    message: "New verification OTP sent to your email.",
  };
};


// Login User

const loginUser = async ({ email, password }) => {
  const cleanEmail = email ? email.toLowerCase().trim() : "";

  // Find user
  const user = await User.findOne({ email: cleanEmail });

  if (!user) {
    throw new Error("User not found");
  }

  // Compare password
  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw new Error("Invalid password");
  }

  // Check if email is verified
  if (!user.isVerified) {
    const otp = generateOTP();
    user.verificationOtp = otp;
    user.verificationOtpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    sendVerificationOtpEmail(cleanEmail, user.fullName, otp).catch((err) => {
      console.warn("[Email Service] Login verification OTP warning:", err.message);
    });

    const err = new Error("Please verify your email address to log in.");
    err.requiresVerification = true;
    err.email = cleanEmail;
    throw err;
  }

  // Generate JWT
  const token = jwt.sign(
    {
      userId: user._id,
      email: user.email,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }

  );

  // Update lastVisitedAt
  user.lastVisitedAt = new Date();
  await user.save();

  // Remove password
  const userObject = user.toObject();
  delete userObject.password;

  return {
    user: userObject,
    token,
  };
};

// Google / Firebase Login User

const googleLoginUser = async ({ email, fullName, photoUrl, googleId, role }) => {
  if (!email) {
    throw new Error("Email is required for Google Authentication");
  }

  const cleanEmail = email.toLowerCase().trim();
  let user = await User.findOne({ email: cleanEmail });

  if (!user) {
    const requestedRole = (role && ["user", "admin", "super_admin"].includes(role)) ? role : "user";
    if (requestedRole === "super_admin") {
      const existingSuperAdmin = await User.findOne({ role: "super_admin", email: { $ne: cleanEmail } });
      if (existingSuperAdmin) {
        throw new Error("A Super Admin account already exists. Only one Super Admin is allowed.");
      }
    }

    // Generate random secure password for Google users
    const randomPassword = crypto.randomBytes(16).toString("hex");
    const hashedPassword = await bcrypt.hash(randomPassword, 10);

    user = await User.create({
      fullName: (fullName || "Google User").trim(),
      email: cleanEmail,
      password: hashedPassword,
      role: requestedRole,
      isVerified: true,
      avatar: {
        url: photoUrl || "",
        publicId: "",
      },
    });

    // Record initial free plan subscription history
    try {
      const freePlan = await Plan.findOne({ slug: "free", isCurrent: true }) || await Plan.findOne({ slug: "free" });
      if (freePlan) {
        await SubscriptionHistory.create({
          userId: user._id,
          planId: freePlan._id,
          action: "activated",
          provider: "system",
          startDate: user.createdAt || new Date(),
          endDate: null,
          amount: 0,
          currency: freePlan.currency || "INR",
          note: "Initial Google user registration on Free plan.",
        });
      }
    } catch (historyErr) {
      console.warn("[Auth Service] Failed to create initial SubscriptionHistory for Google user:", historyErr.message);
    }

    // Send welcome email asynchronously
    sendWelcomeEmail(cleanEmail, fullName || "Valued User").catch((err) => {
      console.warn("[Email Service] Welcome email send warning:", err.message);
    });
  }

  user.lastVisitedAt = new Date();
  await user.save();

  const token = jwt.sign(
    {
      userId: user._id,
      email: user.email,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );

  const userObject = user.toObject();
  delete userObject.password;

  return {
    user: userObject,
    token,
  };
};

// Get Profile

const getProfile = async (userId) => {
  const user = await User.findByIdAndUpdate(
    userId,
    { lastVisitedAt: new Date() },
    { new: true }
  ).select("-password");

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};


// Update Profile

const updateProfile = async (userId, updateData) => {
  const allowedUpdates = {};
  if (updateData.fullName !== undefined) allowedUpdates.fullName = updateData.fullName;
  if (updateData.currency !== undefined) allowedUpdates.currency = updateData.currency;
  if (updateData.mobile !== undefined) allowedUpdates.mobile = updateData.mobile;
  if (updateData.age !== undefined) allowedUpdates.age = Number(updateData.age);
  if (updateData.upiId !== undefined) allowedUpdates.upiId = updateData.upiId;
  if (updateData.categoryBudgets !== undefined) allowedUpdates.categoryBudgets = updateData.categoryBudgets;

  if (updateData.monthlyBudget !== undefined) {
    const existingUser = await User.findById(userId).lean();
    const budgetVal = Number(updateData.monthlyBudget);
    const inputCurr = updateData.currency || existingUser?.currency || "INR";

    allowedUpdates.monthlyBudget = budgetVal;
    if (budgetVal > 0) {
      const currencyService = require("../currency/service");
      const snap = await currencyService.createCurrencySnapshot(budgetVal, inputCurr);
      allowedUpdates.monthlyBudgetINR = snap.amountINR;
      allowedUpdates.monthlyBudgetUSD = snap.amountUSD;
      allowedUpdates.monthlyBudgetCurrency = inputCurr;
    }
  }

  if (updateData.avatar !== undefined) {
    allowedUpdates.avatar = typeof updateData.avatar === "string" ? { url: updateData.avatar } : updateData.avatar;
  }
  if (updateData.role !== undefined) {
    if (updateData.role === "super_admin") {
      const existingSuperAdmin = await User.findOne({ role: "super_admin", _id: { $ne: userId } });
      if (existingSuperAdmin) {
        throw new Error("A Super Admin account already exists. Only one Super Admin is allowed.");
      }
    }
    if (["user", "admin", "super_admin"].includes(updateData.role)) {
      allowedUpdates.role = updateData.role;
    }
  }

  const user = await User.findByIdAndUpdate(
    userId,
    allowedUpdates,
    {
      new: true,
      runValidators: true,
    }
  ).select("-password");

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};

const forgotPassword = async (email) => {
  const user = await User.findOne({ email });

  if (!user) {
    throw new Error("User not found");
  }

  const otp = generateOTP();

  user.resetOtp = otp;
  user.resetOtpExpiry = new Date(Date.now() + 5 * 60 * 1000);

  await user.save();

  // Fire-and-forget — respond immediately, send email in background
  // OTP is already saved in DB so user can verify even if email is slightly delayed
  sendOtpEmail(email, otp).catch((emailErr) => {
    console.error("[Email Service] Forgot password OTP email failed:", emailErr.message);
  });

  return {
    message: "OTP sent successfully",
  };
};

const verifyOtp = async (email, otp) => {
  const user = await User.findOne({ email });

  if (!user) {
    throw new Error("User not found");
  }

  if (!user.resetOtp || user.resetOtp !== otp) {
    throw new Error("Invalid OTP");
  }

  if (user.resetOtpExpiry < new Date()) {
    throw new Error("OTP has expired");
  }

  return {
    message: "OTP verified successfully",
  };
};

const resetPassword = async (email, otp, newPassword) => {
  const user = await User.findOne({ email });

  if (!user) {
    throw new Error("User not found");
  }

  if (!user.resetOtp || user.resetOtp !== otp) {
    throw new Error("Invalid OTP");
  }

  if (user.resetOtpExpiry < new Date()) {
    throw new Error("OTP has expired");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedPassword;
  user.resetOtp = undefined;
  user.resetOtpExpiry = undefined;

  await user.save();

  return {
    message: "Password reset successfully",
  };
};

const handleSupportRequest = async (userId, { subject, message }) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  const queryRecord = await SupportQuery.create({
    userId: user._id,
    userName: user.fullName || "User",
    userEmail: user.email,
    subject: subject.trim(),
    message: message.trim(),
    status: "pending",
  });

  try {
    await sendSupportEmail({
      userEmail: user.email,
      userName: user.fullName,
      subject,
      message,
    });
  } catch (emailErr) {
    console.warn("Support email dispatch failed:", emailErr.message);
  }

  return {
    success: true,
    message: "Support ticket submitted successfully",
    data: queryRecord,
  };
};

const searchUsers = async (query, currentUserId) => {
  return authRepository.searchUsers(query, currentUserId);
};


// Generate a cryptographically secure random token
const generateSecureToken = () => {
  return crypto.randomBytes(40).toString("hex");
};

// Generate Access + Refresh token pair for Dashboard sessions
const generateTokenPair = async (user, userAgent = "") => {
  // Short-lived access token (15 minutes)
  const accessToken = jwt.sign(
    { userId: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );

  // Long-lived refresh token (30 days)
  const rawRefreshToken = generateSecureToken();
  const refreshTokenHash = await bcrypt.hash(rawRefreshToken, 10);

  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  await RefreshToken.create({
    userId: user._id,
    tokenHash: refreshTokenHash,
    expiresAt,
    userAgent,
  });

  return {
    accessToken,
    refreshToken: rawRefreshToken,
    accessTokenExpiresIn: 15 * 60 * 1000, // 15 minutes in ms
    refreshTokenExpiresIn: 30 * 24 * 60 * 60 * 1000, // 30 days in ms
  };
};

// Validate refresh token and rotate (issue new pair, invalidate old)
const refreshAccessToken = async (rawRefreshToken, userAgent = "") => {
  if (!rawRefreshToken) {
    throw new Error("Refresh token is required.");
  }

  // Find all non-expired refresh tokens and check against hash
  const storedTokens = await RefreshToken.find({
    expiresAt: { $gt: new Date() },
  });

  let matchedToken = null;
  for (const stored of storedTokens) {
    const isMatch = await bcrypt.compare(rawRefreshToken, stored.tokenHash);
    if (isMatch) {
      matchedToken = stored;
      break;
    }
  }

  if (!matchedToken) {
    throw new Error("Invalid or expired refresh token.");
  }

  // Get the user
  const user = await User.findById(matchedToken.userId).select("-password");
  if (!user) {
    await RefreshToken.deleteOne({ _id: matchedToken._id });
    throw new Error("User not found.");
  }

  // Delete the old refresh token (rotation — one-time use)
  await RefreshToken.deleteOne({ _id: matchedToken._id });

  // Generate new token pair
  const newTokenPair = await generateTokenPair(user, userAgent);

  return {
    ...newTokenPair,
    user,
  };
};

// Revoke a specific refresh token
const revokeRefreshToken = async (rawRefreshToken) => {
  if (!rawRefreshToken) return;

  const storedTokens = await RefreshToken.find({
    expiresAt: { $gt: new Date() },
  });

  for (const stored of storedTokens) {
    const isMatch = await bcrypt.compare(rawRefreshToken, stored.tokenHash);
    if (isMatch) {
      await RefreshToken.deleteOne({ _id: stored._id });
      return;
    }
  }
};

// Revoke ALL refresh tokens for a user (force logout everywhere)
const revokeAllUserTokens = async (userId) => {
  await RefreshToken.deleteMany({ userId });
};

module.exports = {
  generateTokenPair,
  refreshAccessToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  registerUser,
  sendRegistrationOtp,
  verifyRegistrationOtp,
  completeRegistration,
  resendVerificationOtp,
  loginUser,
  googleLoginUser,
  getProfile,
  updateProfile,
  forgotPassword,
  verifyOtp,
  resetPassword,
  searchUsers,
  handleSupportRequest,
};