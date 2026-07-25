const Friend = require("./model");
const User = require("../auth/model");

const createRequest = (data) => {
  return Friend.create(data);
};

const findById = (id) => {
  return Friend.findById(id);
};

const findPendingRequest = (sender, receiver) => {
  return Friend.findOne({
    sender,
    receiver,
    status: "pending",
  });
};

const findExistingFriendship = (user1, user2) => {
  return Friend.findOne({
    $or: [
      { sender: user1, receiver: user2 },
      { sender: user2, receiver: user1 },
    ],
  });
};

const acceptRequest = (requestId) => {
  return Friend.findByIdAndUpdate(
    requestId,
    { status: "accepted" },
    { new: true }
  );
};

const rejectRequest = (requestId) => {
  return Friend.findByIdAndUpdate(
    requestId,
    { status: "rejected" },
    { new: true }
  );
};

const getPendingRequests = (receiver) => {
  return Friend.find({
    receiver,
    status: "pending",
  }).populate("sender", "fullName username avatar");
};

const getFriends = (userId) => {
  return Friend.find({
    $or: [
      { sender: userId },
      { receiver: userId },
    ],
    status: "accepted",
  })
    .populate("sender", "fullName username avatar")
    .populate("receiver", "fullName username avatar");
};

const removeFriend = (user1, user2) => {
  return Friend.findOneAndDelete({
    $or: [
      { sender: user1, receiver: user2 },
      { sender: user2, receiver: user1 },
    ],
    status: "accepted",
  });
};

const searchUsers = (query, currentUserId) => {
  if (!query || !query.trim()) return [];
  const searchRegex = new RegExp(query.trim(), "i");
  return User.find({
    _id: { $ne: currentUserId },
    $or: [
      { fullName: searchRegex },
      { username: searchRegex },
      { email: searchRegex },
    ],
  })
    .select("fullName username email avatar")
    .limit(20);
};

module.exports = {
  createRequest,
  findById,
  findPendingRequest,
  findExistingFriendship,
  acceptRequest,
  rejectRequest,
  getPendingRequests,
  getFriends,
  removeFriend,
  searchUsers,
};