const express = require("express");
const {
  addRecurring,
  getAllRecurring,
  getRecurring,
  editRecurring,
  removeRecurring,
  toggleStatus,
} = require("./controller");
const authenticate = require("../auth/auth.middleware");

const router = express.Router();

router.post("/", authenticate, addRecurring);
router.get("/", authenticate, getAllRecurring);
router.get("/:id", authenticate, getRecurring);
router.put("/:id", authenticate, editRecurring);
router.delete("/:id", authenticate, removeRecurring);
router.patch("/:id/status", authenticate, toggleStatus);

module.exports = router;
