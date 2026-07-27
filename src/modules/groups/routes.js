const express = require("express");

const router = express.Router();

const authenticate = require("../auth/auth.middleware");

const {
  createGroup,
  getGroups,
  getGroupById,
  updateGroup,
  deleteGroup,
  addMember,
  removeMember,
  leaveGroup,
} = require("./controller");

const {
  validateCreateGroup,
  validateObjectId,
} = require("./validation");

/* Create Group */
router.post(
  "/",
  authenticate,
  validateCreateGroup,
  createGroup
);

/* Get My Groups */
router.get(
  "/",
  authenticate,
  getGroups
);

/* Get Group Details */
router.get(
  "/:groupId",
  authenticate,
  validateObjectId,
  getGroupById
);

/* Update Group */
router.put(
  "/:groupId",
  authenticate,
  validateObjectId,
  validateCreateGroup,
  updateGroup
);

/* Delete Group */
router.delete(
  "/:groupId",
  authenticate,
  validateObjectId,
  deleteGroup
);

/* Add Member */
router.post(
  "/:groupId/members",
  authenticate,
  validateObjectId,
  addMember
);

/* Remove Member */
router.delete(
  "/:groupId/members/:memberId",
  authenticate,
  validateObjectId,
  removeMember
);

/* Leave Group */
router.delete(
  "/:groupId/leave",
  authenticate,
  validateObjectId,
  leaveGroup
);

module.exports = router;