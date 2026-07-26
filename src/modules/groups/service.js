const groupRepository = require("./repository");

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
const updateGroup = async (groupId, updateData) => {
  return await groupRepository.updateGroup(groupId, updateData);
};

// Delete Group
const deleteGroup = async (groupId) => {
  return await groupRepository.deleteGroup(groupId);
};

// Add Member
const addMember = async (groupId, memberId) => {
  return await groupRepository.addMember(groupId, memberId);
};

// Remove Member
const removeMember = async (groupId, memberId) => {
  return await groupRepository.removeMember(groupId, memberId);
};

// Leave Group
const leaveGroup = async (groupId, memberId) => {
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