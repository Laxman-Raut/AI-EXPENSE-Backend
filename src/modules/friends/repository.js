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
      { _id: user2 },
      { sender: user1, receiver: user2 },
      { sender: user2, receiver: user1 },
    ],
  });
};

const searchUsers = async (query, currentUserId) => {
  if (!query || !query.trim()) return [];
  const searchRegex = new RegExp(query.trim(), "i");
  const users = await User.find({
    _id: { $ne: currentUserId },
    $or: [
      { fullName: searchRegex },
      { username: searchRegex },
      { email: searchRegex },
    ],
  })
    .select("fullName username email avatar")
    .limit(20)
    .lean();

  if (!users.length) return [];

  const userIds = users.map((u) => u._id);
  const friendships = await Friend.find({
    $or: [
      { sender: currentUserId, receiver: { $in: userIds } },
      { sender: { $in: userIds }, receiver: currentUserId },
    ],
  }).lean();

  const friendshipMap = new Map();
  friendships.forEach((f) => {
    const sId = f.sender ? f.sender.toString() : "";
    const rId = f.receiver ? f.receiver.toString() : "";
    const currStr = currentUserId ? currentUserId.toString() : "";
    const otherId = sId === currStr ? rId : sId;

    if (f.status === "accepted") {
      friendshipMap.set(otherId, "accepted");
    } else if (f.status === "pending") {
      if (sId === currStr) {
        friendshipMap.set(otherId, "sent");
      } else {
        friendshipMap.set(otherId, "received");
      }
    }
  });

  return users.map((u) => {
    const uId = u._id ? u._id.toString() : "";
    const status = friendshipMap.get(uId) || "none";
    return {
      ...u,
      friendshipStatus: status,
      isFriend: status === "accepted",
    };
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
  searchUsers,
};