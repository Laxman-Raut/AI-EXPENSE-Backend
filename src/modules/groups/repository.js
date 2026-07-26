const Group = require("./model");

// Create Group
const createGroup = async (groupData) => {
  return await Group.create(groupData);
};

// Get All Groups of Logged-in User
const getGroups = async (userId) => {
  return await Group.find({
    members: userId,
    isActive: true,
  })
    .populate("createdBy", "fullName email avatar")
    .populate("members", "fullName email avatar")
    .sort({ createdAt: -1 });
};

// Get Single Group
const getGroupById = async (groupId) => {
  return await Group.findById(groupId)
    .populate("createdBy", "fullName email avatar")
    .populate("members", "fullName email avatar");
};

// Update Group
const updateGroup = async (groupId, updateData) => {
  return await Group.findByIdAndUpdate(groupId, updateData, {
    new: true,
  });
};

// Soft Delete Group
const deleteGroup = async (groupId) => {
  return await Group.findByIdAndUpdate(
    groupId,
    {
      isActive: false,
    },
    {
      new: true,
    }
  );
};

// Add Member
const addMember = async (groupId, memberId) => {
  return await Group.findByIdAndUpdate(
    groupId,
    {
      $addToSet: {
        members: memberId,
      },
    },
    {
      new: true,
    }
  );
};

// Remove Member
const removeMember = async (groupId, memberId) => {
  return await Group.findByIdAndUpdate(
    groupId,
    {
      $pull: {
        members: memberId,
      },
    },
    {
      new: true,
    }
  );
};

// Leave Group
const leaveGroup = async (groupId, memberId) => {
  return await Group.findByIdAndUpdate(
    groupId,
    {
      $pull: {
        members: memberId,
      },
    },
    {
      new: true,
    }
  );
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