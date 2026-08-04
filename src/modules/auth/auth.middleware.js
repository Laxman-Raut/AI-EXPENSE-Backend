const jwt = require("jsonwebtoken");

const authenticate = (req, res, next) => {
  try {
    let token = null;

    // Priority 1: HttpOnly cookie (Dashboard)
    if (req.cookies && req.cookies.access_token) {
      token = req.cookies.access_token;
    }

    // Priority 2: Authorization Bearer header (Mobile App)
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
      }
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;
    // Normalize user ID property across all controllers
    const normalizedId = decoded.userId || decoded.id || decoded._id;
    req.user.id = normalizedId;
    req.user.userId = normalizedId;
    req.user._id = normalizedId;

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Session expired. Please refresh your token.",
        code: "TOKEN_EXPIRED",
      });
    }
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }
};

module.exports = authenticate;