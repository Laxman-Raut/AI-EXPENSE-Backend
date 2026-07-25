const express = require("express");
const router = express.Router();

const friendController = require("./controller");
const {
  validateSendFriendRequest,
  validateRespondFriendRequest,
} = require("./validation");
const auth = require("../auth/auth.middleware");

// Send Friend Request
router.post(
  "/request",
  auth,
  validateSendFriendRequest,
  friendController.sendFriendRequest
);

// Accept Friend Request
router.post(
  "/accept",
  auth,
  validateRespondFriendRequest,
  friendController.acceptFriendRequest
);

// Reject Friend Request
router.post(
  "/reject",
  auth,
  validateRespondFriendRequest,
  friendController.rejectFriendRequest
);

// Get Pending Requests
router.get(
  "/requests",
  auth,
  friendController.getPendingRequests
);

// Search Users
router.get(
  "/search",
  auth,
  friendController.searchUsers
);

router.get(
  "/search-users",
  auth,
  friendController.searchUsers
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