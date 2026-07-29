const User = require("./model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { sendOtpEmail, sendSupportEmail, sendWelcomeEmail, sendVerificationOtpEmail } = require("../email");
const generateOTP = require("./otp");
const Plan = require("../plan/model");
const SubscriptionHistory = require("../subscription-history/model");
const authRepository = require("./repository");
// Register User

const registerUser = async (userData) => {
  const { fullName, email, password } = userData;
  const cleanEmail = email ? email.toLowerCase().trim() : "";

  // Check if user already exists
  let existingUser = await User.findOne({ email: cleanEmail });

  if (existingUser) {
    if (existingUser.isVerified) {
      throw new Error("Email already registered");
    }
    // Unverified existing user: update details, password and re-issue verification OTP
    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOTP();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    existingUser.fullName = fullName.trim();
    existingUser.password = hashedPassword;
    existingUser.verificationOtp = otp;
    existingUser.verificationOtpExpiry = expiry;
    await existingUser.save();

    sendVerificationOtpEmail(cleanEmail, fullName.trim(), otp).catch((err) => {
      console.warn("[Email Service] Verification OTP email warning:", err.message);
    });

    return {
      requiresVerification: true,
      email: cleanEmail,
      message: "Verification OTP sent to your email.",
    };
  }

  // Hash password for new user
  const hashedPassword = await bcrypt.hash(password, 10);
  const otp = generateOTP();
  const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

  // Create user (isVerified = false by default)
  const user = await User.create({
    fullName: fullName.trim(),
    email: cleanEmail,
    password: hashedPassword,
    isVerified: false,
    verificationOtp: otp,
    verificationOtpExpiry: expiry,
  });

  // Send registration verification OTP email asynchronously
  sendVerificationOtpEmail(cleanEmail, fullName.trim(), otp).catch((err) => {
    console.warn("[Email Service] Verification OTP email warning:", err.message);
  });

  return {
    requiresVerification: true,
    email: cleanEmail,
    message: "Registration successful. Please enter the verification OTP sent to your email.",
  };
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

const googleLoginUser = async ({ email, fullName, photoUrl, googleId }) => {
  if (!email) {
    throw new Error("Email is required for Google Authentication");
  }

  const cleanEmail = email.toLowerCase().trim();
  let user = await User.findOne({ email: cleanEmail });

  if (!user) {
    // Generate random secure password for Google users
    const randomPassword = crypto.randomBytes(16).toString("hex");
    const hashedPassword = await bcrypt.hash(randomPassword, 10);

    user = await User.create({
      fullName: (fullName || "Google User").trim(),
      email: cleanEmail,
      password: hashedPassword,
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
  if (updateData.monthlyBudget !== undefined) allowedUpdates.monthlyBudget = Number(updateData.monthlyBudget);
  if (updateData.mobile !== undefined) allowedUpdates.mobile = updateData.mobile;
  if (updateData.age !== undefined) allowedUpdates.age = Number(updateData.age);
  if (updateData.upiId !== undefined) allowedUpdates.upiId = updateData.upiId;
  if (updateData.categoryBudgets !== undefined) allowedUpdates.categoryBudgets = updateData.categoryBudgets;
  if (updateData.avatar !== undefined) {
    allowedUpdates.avatar = typeof updateData.avatar === "string" ? { url: updateData.avatar } : updateData.avatar;
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

  await sendOtpEmail(email, otp);

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

  await sendSupportEmail({
    userEmail: user.email,
    userName: user.fullName,
    subject,
    message,
  });

  return {
    success: true,
    message: "Support emails sent successfully",
  };
};

const searchUsers = async (query, currentUserId) => {
  return authRepository.searchUsers(query, currentUserId);
};


module.exports = {
  registerUser,
  verifyRegistrationOtp,
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