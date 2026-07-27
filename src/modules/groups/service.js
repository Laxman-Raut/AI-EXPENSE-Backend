const groupRepository = require("./repository");

const getUserId = (userObj) => {
  if (!userObj) return null;
  if (typeof userObj === "object" && userObj._id) return userObj._id.toString();
  return userObj.toString();
};

// Create Group
const createGroup = async (data, userId) => {
  const groupData = {
    ...data,
    createdBy: userId,
    members: [userId], // Creator automatically becomes first member
  };

  return await groupRepository.createGroup(groupData);
};

// Get All Groups
const getGroups = async (userId) => {
  return await groupRepository.getGroups(userId);
};

// Get Group Details
const getGroupById = async (groupId) => {
  return await groupRepository.getGroupById(groupId);
};

// Update Group
const updateGroup = async (groupId, userId, updateData) => {
  const group = await groupRepository.getGroupById(groupId);

  if (!group) {
    throw new Error("Group not found");
  }

  const createdById = getUserId(group.createdBy);
  if (createdById !== userId.toString()) {
    throw new Error("Only group owner can update this group");
  }

  return await groupRepository.updateGroup(groupId, updateData);
};

// Delete Group
const deleteGroup = async (groupId, userId) => {
  const group = await groupRepository.getGroupById(groupId);

  if (!group) {
    throw new Error("Group not found");
  }

  const createdById = getUserId(group.createdBy);
  if (createdById !== userId.toString()) {
    throw new Error("Only group owner can delete this group");
  }

  return await groupRepository.deleteGroup(groupId);
};

// Add Member
const addMember = async (groupId, userId, memberId) => {
  const group = await groupRepository.getGroupById(groupId);

  if (!group) {
    throw new Error("Group not found");
  }

  const createdById = getUserId(group.createdBy);
  if (createdById !== userId.toString()) {
    throw new Error("Only group owner can add members");
  }

  const isMember = group.members.some(
    (member) => getUserId(member) === memberId.toString()
  );

  if (isMember) {
    throw new Error("User is already a member of this group");
  }

  return await groupRepository.addMember(groupId, memberId);
};

// Remove Member
const removeMember = async (groupId, userId, memberId) => {
  const group = await groupRepository.getGroupById(groupId);

  if (!group) {
    throw new Error("Group not found");
  }

  const createdById = getUserId(group.createdBy);
  if (createdById !== userId.toString()) {
    throw new Error("Only group owner can remove members");
  }

  if (createdById === memberId.toString()) {
    throw new Error("Group owner cannot be removed");
  }

  return await groupRepository.removeMember(groupId, memberId);
};

// Leave Group
const leaveGroup = async (groupId, memberId) => {
  const group = await groupRepository.getGroupById(groupId);

  if (!group) {
    throw new Error("Group not found");
  }

  const isMember = group.members.some(
    (member) => getUserId(member) === memberId.toString()
  );

  if (!isMember) {
    throw new Error("You are not a member of this group");
  }

  const createdById = getUserId(group.createdBy);
  if (createdById === memberId.toString()) {
    throw new Error(
      "Group owner cannot leave. Transfer ownership or delete the group."
    );
  }

  return await groupRepository.leaveGroup(groupId, memberId);
};

module.exports = {
  createGroup,
  getGroups,
  getGroupById,
  updateGroup,
  deleteGroup,
  addMember,
  removeMember,
  leaveGroup,
};