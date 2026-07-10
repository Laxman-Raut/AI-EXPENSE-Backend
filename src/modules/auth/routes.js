const express = require("express");

const { register, login, profile, update } = require("./controller");

const {
  validateRegister,
  validateLogin,
} = require("./middleware");

const authenticate = require("./auth.middleware");

const router = express.Router();

router.post("/register", validateRegister, register);

router.post("/login", validateLogin, login);

router.get("/me", authenticate, profile);
router.put("/profile", authenticate, update);

module.exports = router;