const User = require("./model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// =======================
// Register User
// =======================
const registerUser = async (userData) => {
  const { fullName, email, password } = userData;

  // Check if user already exists
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new Error("Email already registered");
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create user
  const user = await User.create({
    fullName,
    email,
    password: hashedPassword,
  });

  // Remove password
  const userObject = user.toObject();
  delete userObject.password;

  return userObject;
};

// =======================
// Login User
// =======================
const loginUser = async ({ email, password }) => {
  // Find user
  const user = await User.findOne({ email });

  if (!user) {
    throw new Error("User not found");
  }

  // Compare password
  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw new Error("Invalid password");
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

  // Remove password
  const userObject = user.toObject();
  delete userObject.password;

  return {
    user: userObject,
    token,
  };
};

// =======================
// Get Profile
// =======================
const getProfile = async (userId) => {
  const user = await User.findById(userId).select("-password");

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};

// =======================
// Update Profile
// =======================
const updateProfile = async (userId, updateData) => {
  const allowedUpdates = {};
  if (updateData.fullName !== undefined) allowedUpdates.fullName = updateData.fullName;
  if (updateData.currency !== undefined) allowedUpdates.currency = updateData.currency;
  if (updateData.monthlyBudget !== undefined) allowedUpdates.monthlyBudget = Number(updateData.monthlyBudget);

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

module.exports = {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
};