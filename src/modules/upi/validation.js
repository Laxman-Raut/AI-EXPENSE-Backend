const { z } = require("zod");

const generateDeepLinkSchema = z.object({
  splitRequestId: z.string().min(1, "Split Request ID is required"),
});

const validateGenerateDeepLink = (req, res, next) => {
  try {
    generateDeepLinkSchema.parse(req.body);
    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.issues.map((i) => i.message).join(", "),
      errors: error.issues,
    });
  }
};

module.exports = {
  validateGenerateDeepLink,
};