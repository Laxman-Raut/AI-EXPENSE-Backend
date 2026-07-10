const { registerUser
     ,loginUser,
      getProfile,
      updateProfile} = require("./service");

const register = async (req, res) => {
  try {
    const user = await registerUser(req.body);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
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

module.exports = {
  register,
  login,
  profile,
  update,
};