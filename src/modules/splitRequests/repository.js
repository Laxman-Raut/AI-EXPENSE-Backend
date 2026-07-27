const SplitRequest = require("./model");

// Create Split Request
const createSplitRequest = async (data) => {
  const created = await SplitRequest.create(data);
  return await SplitRequest.findById(created._id)
    .populate("paidBy", "fullName email avatar")
    .populate("participants.user", "fullName email avatar");
};

// Get All Split Requests of a Group
const getGroupSplitRequests = async (groupId) => {
  return await SplitRequest.find({ group: groupId })
    .populate("paidBy", "fullName email avatar")
    .populate("participants.user", "fullName email avatar")
    .sort({ createdAt: -1 });
};

// Get Single Split Request
const getSplitRequestById = async (splitId) => {
  return await SplitRequest.findById(splitId)
    .populate("paidBy", "fullName email avatar")
    .populate("participants.user", "fullName email avatar");
};

// Update Split Request
const updateSplitRequest = async (splitId, updateData) => {
  return await SplitRequest.findByIdAndUpdate(splitId, updateData, {
    new: true,
  })
    .populate("paidBy", "fullName email avatar")
    .populate("participants.user", "fullName email avatar");
};

// Delete Split Request
const deleteSplitRequest = async (splitId) => {
  return await SplitRequest.findByIdAndDelete(splitId);
};

module.exports = {
  createSplitRequest,
  getGroupSplitRequests,
  getSplitRequestById,
  updateSplitRequest,
  deleteSplitRequest,
};