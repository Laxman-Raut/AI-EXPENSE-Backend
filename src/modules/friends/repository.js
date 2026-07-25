const Friend = require("./model");

const createRequest = (data) => {
  return Friend.create(data);
};

const findById = (id) => {
  return Friend.findById(id);
};

const findPendingRequest = (requester, recipient) => {
  return Friend.findOne({
    requester,
    recipient,
    status: "pending",
  });
};

const findExistingFriendship = (user1, user2) => {
  return Friend.findOne({
    $or: [
      { requester: user1, recipient: user2 },
      { requester: user2, recipient: user1 },
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

const getPendingRequests = (recipient) => {
  return Friend.find({
    recipient,
    status: "pending",
  }).populate("requester", "fullName username avatar");
};

const getFriends = (userId) => {
  return Friend.find({
    $or: [
      { requester: userId },
      { recipient: userId },
    ],
    status: "accepted",
  })
    .populate("requester", "fullName username avatar")
    .populate("recipient", "fullName username avatar");
};

const removeFriend = (user1, user2) => {
  return Friend.findOneAndDelete({
    $or: [
      { requester: user1, recipient: user2 },
      { requester: user2, recipient: user1 },
    ],
    status: "accepted",
  });
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
};