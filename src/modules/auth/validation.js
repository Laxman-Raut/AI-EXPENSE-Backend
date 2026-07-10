const { z } = require("zod");

const registerSchema = z.object({
  fullName: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(8),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

module.exports = {
  registerSchema,
  loginSchema,
};