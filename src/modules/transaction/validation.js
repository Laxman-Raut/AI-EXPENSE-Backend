
const { z } = require("zod");

const transactionSchema = z.object({
  type: z.enum(["expense", "income"]),

  category: z.string().min(2),

  description: z.string().min(3),

  amount: z.number().positive(),

  paymentMethod: z.enum([
    "Cash",
    "UPI",
    "Credit Card",
    "Debit Card",
    "Wallet",
    "Bank Transfer",
  ]).optional(),

  transactionDate: z.string().optional(),

  note: z.string().optional(),
});

const validateTransaction = (req, res, next) => {
  try {
    req.body = transactionSchema.parse(req.body);
    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.issues.map(i => i.message).join(", "),
      errors: error.issues,
    });
  }
};

module.exports = {
  validateTransaction,
};