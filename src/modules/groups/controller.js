const groupService = require("./service");

// Create Group
const createGroup = async (req, res, next) => {
  try {
    const group = await groupService.createGroup(req.body, req.user.id);

    return res.status(201).json({
      success: true,
      message: "Group created successfully",
      data: group,
    });
  } catch (error) {
    next(error);
  }
};

// Get My Groups
const getGroups = async (req, res, next) => {
  try {
    const groups = await groupService.getGroups(req.user.id);

    return res.status(200).json({
      success: true,
      data: groups,
    });
  } catch (error) {
    next(error);
  }
};

// Get Group Details
const getGroupById = async (req, res, next) => {
  try {
    const group = await groupService.getGroupById(req.params.groupId);

    return res.status(200).json({
      success: true,
      data: group,
    });
  } catch (error) {
    next(error);
  }
};

// Update Group
const updateGroup = async (req, res, next) => {
  try {
   const group = await groupService.updateGroup(
  req.params.groupId,
  req.user.id,
  req.body
);

    return res.status(200).json({
      success: true,
      message: "Group updated successfully",
      data: group,
    });
  } catch (error) {
    next(error);
  }
};

// Delete Group
const deleteGroup = async (req, res, next) => {
  try {
    await groupService.deleteGroup(
  req.params.groupId,
  req.user.id
);
    return res.status(200).json({
      success: true,
      message: "Group deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Add Member
const addMember = async (req, res, next) => {
  try {
  const group = await groupService.addMember(
  req.params.groupId,
  req.user.id,
  req.body.memberId
);

    return res.status(200).json({
      success: true,
      message: "Member added successfully",
      data: group,
    });
  } catch (error) {
    next(error);
  }
};

// Remove Member
const removeMember = async (req, res, next) => {
  try {
    const group = await groupService.removeMember(
  req.params.groupId,
  req.user.id,
  req.params.memberId
);
    return res.status(200).json({
      success: true,
      message: "Member removed successfully",
      data: group,
    });
  } catch (error) {
    next(error);
  }
};

// Leave Group
const leaveGroup = async (req, res, next) => {
  try {
    const group = await groupService.leaveGroup(
      req.params.groupId,
      req.user.id
    );

    return res.status(200).json({
      success: true,
      message: "You left the group successfully",
      data: group,
    });
  } catch (error) {
    next(error);
  }
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