const jwt = require("jsonwebtoken");

const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;
    // Normalize user ID property across all controllers (support req.user.id, req.user.userId, req.user._id)
    const normalizedId = decoded.userId || decoded.id || decoded._id;
    req.user.id = normalizedId;
    req.user.userId = normalizedId;
    req.user._id = normalizedId;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }
};

module.exports = authenticate;