const { z } = require("zod");

const createPlanSchema = z.object({
  name: z.string().trim().min(3, "Plan name must be at least 3 characters").max(50, "Plan name cannot exceed 50 characters"),
  slug: z.string().trim().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  description: z.string().max(300, "Description cannot exceed 300 characters").optional().default(""),
  price: z.number().min(0, "Price must be >= 0"),
  currency: z.enum(["INR", "USD", "EUR"]).optional().default("INR"),
  billingCycle: z.enum(["monthly", "yearly", "lifetime"]),
  durationDays: z.number().int().min(1, "Duration must be at least 1 day"),
  features: z.array(z.string().trim().min(1, "Feature text cannot be empty")).min(1, "At least one feature is required"),
  status: z.enum(["draft", "active", "inactive"]).optional().default("draft"),
  visibility: z.enum(["public", "hidden"]).optional().default("public"),
  isPopular: z.boolean().optional().default(false),
  displayOrder: z.number().int().min(0).optional().default(0),
  color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid hex color code").optional().default("#2563EB"),
  icon: z.string().optional().default("crown"),
});

const updatePlanSchema = createPlanSchema.partial();

const validateCreatePlan = (req, res, next) => {
  try {
    createPlanSchema.parse(req.body);
    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.issues ? error.issues.map((i) => i.message).join(", ") : error.message,
      errors: error.issues,
    });
  }
};

const validateUpdatePlan = (req, res, next) => {
  try {
    updatePlanSchema.parse(req.body);
    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.issues ? error.issues.map((i) => i.message).join(", ") : error.message,
      errors: error.issues,
    });
  }
};

module.exports = {
  validateCreatePlan,
  validateUpdatePlan,
};