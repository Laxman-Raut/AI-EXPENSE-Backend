const express = require("express");
const router = express.Router();
const authenticate = require("../auth/auth.middleware");
const controller = require("./controller");
const {
  createJarSchema,
  updateJarSchema,
  depositSchema,
  withdrawSchema,
  transferSchema,
  validateRequest,
} = require("./validation");

// All routes require authentication
router.use(authenticate);

// List & Summary
router.get("/", controller.getJars);

// AI Suggestions
router.get("/suggestions", controller.getAISuggestions);

// Create Jar
router.post("/", validateRequest(createJarSchema), controller.createJar);

// Transfer between Jars
router.post("/transfer", validateRequest(transferSchema), controller.transfer);

// Single Jar Operations
router.get("/:id", controller.getJarById);
router.patch("/:id", validateRequest(updateJarSchema), controller.updateJar);
router.delete("/:id", controller.deleteJar);

// Deposit & Withdraw
router.post("/:id/deposit", validateRequest(depositSchema), controller.deposit);
router.post("/:id/withdraw", validateRequest(withdrawSchema), controller.withdraw);


module.exports = router;
