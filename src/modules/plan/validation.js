const { body } = require("express-validator");

const validateCreatePlan = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Plan name is required.")
    .isLength({ min: 3, max: 50 })
    .withMessage("Plan name must be between 3 and 50 characters."),

  body("slug")
    .trim()
    .notEmpty()
    .withMessage("Slug is required.")
    .matches(/^[a-z0-9-]+$/)
    .withMessage("Slug can only contain lowercase letters, numbers and hyphens."),

  body("description")
    .optional()
    .isLength({ max: 300 })
    .withMessage("Description cannot exceed 300 characters."),

  body("price")
    .notEmpty()
    .withMessage("Price is required.")
    .isFloat({ min: 0 })
    .withMessage("Price must be greater than or equal to 0."),

  body("currency")
    .optional()
    .isIn(["INR", "USD", "EUR"])
    .withMessage("Invalid currency."),

  body("billingCycle")
    .notEmpty()
    .withMessage("Billing cycle is required.")
    .isIn(["monthly", "yearly", "lifetime"])
    .withMessage("Invalid billing cycle."),

  body("durationDays")
    .notEmpty()
    .withMessage("Duration is required.")
    .isInt({ min: 1 })
    .withMessage("Duration must be greater than 0."),

  body("features")
    .isArray({ min: 1 })
    .withMessage("At least one feature is required."),

  body("features.*")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("Feature cannot be empty."),

  body("status")
    .optional()
    .isIn(["draft", "active", "inactive"])
    .withMessage("Invalid status."),

  body("visibility")
    .optional()
    .isIn(["public", "hidden"])
    .withMessage("Invalid visibility."),

  body("isPopular")
    .optional()
    .isBoolean()
    .withMessage("isPopular must be boolean."),

  body("displayOrder")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Display order must be positive."),

  body("color")
    .optional()
    .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    .withMessage("Invalid color code."),

  body("icon")
    .optional()
    .isString()
    .trim()
];

const validateUpdatePlan = [
  body("name").optional().trim().isLength({ min: 3, max: 50 }),

  body("description").optional().isLength({ max: 300 }),

  body("price").optional().isFloat({ min: 0 }),

  body("currency").optional().isIn(["INR", "USD", "EUR"]),

  body("billingCycle")
    .optional()
    .isIn(["monthly", "yearly", "lifetime"]),

  body("durationDays")
    .optional()
    .isInt({ min: 1 }),

  body("features")
    .optional()
    .isArray(),

  body("status")
    .optional()
    .isIn(["draft", "active", "inactive"]),

  body("visibility")
    .optional()
    .isIn(["public", "hidden"]),

  body("isPopular")
    .optional()
    .isBoolean(),

  body("displayOrder")
    .optional()
    .isInt({ min: 0 }),

  body("color")
    .optional()
    .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/),

  body("icon")
    .optional()
    .isString(),
];

module.exports = {
  validateCreatePlan,
  validateUpdatePlan,
};