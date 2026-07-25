const express = require("express");
const router = express.Router();

const friendController = require("./controller");
const validate = require("../../middleware/validator");
const {
  sendFriendRequestSchema,
  respondFriendRequestSchema,
} = require("./validation");
const auth = require("../../middleware/auth");

// Send Friend Request
router.post(
  "/request",
  auth,
  validate(sendFriendRequestSchema),
  friendController.sendFriendRequest
);

// Accept Friend Request
router.post(
  "/accept",
  auth,
  validate(respondFriendRequestSchema),
  friendController.acceptFriendRequest
);

// Reject Friend Request
router.post(
  "/reject",
  auth,
  validate(respondFriendRequestSchema),
  friendController.rejectFriendRequest
);

// Get Pending Requests
router.get(
  "/requests",
  auth,
  friendController.getPendingRequests
);

// Get Friends List
router.get(
  "/",
  auth,
  friendController.getFriends
);

// Remove Friend
router.delete(
  "/:friendId",
  auth,
  friendController.removeFriend
);

module.exports = router;