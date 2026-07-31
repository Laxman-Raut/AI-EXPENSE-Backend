const friendRepository = require("./repository");
const User = require("../auth/model");

const sendFriendRequest = async (requesterId, recipientId) => {
  const reqStr = typeof requesterId === 'object' && requesterId !== null ? String(requesterId._id || requesterId.id || '') : String(requesterId || '');
  const recStr = typeof recipientId === 'object' && recipientId !== null ? String(recipientId._id || recipientId.id || '') : String(recipientId || '');

  // Can't send request to yourself
  if (reqStr === recStr) {
    throw new Error("You cannot send a friend request to yourself.");
  }

  // Check recipient exists
  const recipient = await User.findById(recStr);
  if (!recipient) {
    throw new Error("User not found.");
  }

  // Check existing relationship
  const existing = await friendRepository.findExistingFriendship(
    reqStr,
    recStr
  );

  if (existing) {
    if (existing.status === "accepted") {
      throw new Error("You are already friends.");
    }

    if (existing.status === "pending") {
      const existingSenderStr = existing.sender ? existing.sender.toString() : "";
      if (existingSenderStr === reqStr) {
        throw new Error("Friend request already sent.");
      } else {
        // Recipient had already sent a request to you! Automatically accept it.
        return await friendRepository.acceptRequest(existing._id);
      }
    }

    if (existing.status === "rejected") {
      // Allow re-sending request by updating existing record to pending
      existing.sender = reqStr;
      existing.receiver = recStr;
      existing.status = "pending";
      return await existing.save();
    }
  }

  return friendRepository.createRequest({
    sender: reqStr,
    receiver: recStr,
    status: "pending",
  });
};

const acceptFriendRequest = async (requestId) => {
  const request = await friendRepository.findById(requestId);

  if (!request) {
    throw new Error("Friend request not found.");
  }

  if (request.status !== "pending") {
    throw new Error("This request has already been processed.");
  }

  return friendRepository.acceptRequest(requestId);
};

const rejectFriendRequest = async (requestId) => {
  const request = await friendRepository.findById(requestId);

  if (!request) {
    throw new Error("Friend request not found.");
  }

  if (request.status !== "pending") {
    throw new Error("This request has already been processed.");
  }

  return friendRepository.rejectRequest(requestId);
};

const getPendingRequests = async (userId) => {
  return friendRepository.getPendingRequests(userId);
};

const getFriends = async (userId) => {
  const friendships = await friendRepository.getFriends(userId);
  const currIdStr = userId ? userId.toString() : "";

  return friendships.map((f) => {
    const senderIdStr = f.sender?._id ? f.sender._id.toString() : f.sender?.toString() || "";
    const isSender = senderIdStr === currIdStr;
    const friendObj = isSender ? f.receiver : f.sender;

    return {
      _id: f._id,
      status: f.status,
      createdAt: f.createdAt,
      friend: friendObj,
      sender: f.sender,
      receiver: f.receiver,
    };
  });
};

const removeFriend = async (userId, friendId) => {
  return friendRepository.removeFriend(userId, friendId);
};

const searchUsers = async (query, currentUserId) => {
  return friendRepository.searchUsers(query, currentUserId);
};

module.exports = {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  getPendingRequests,
  getFriends,
  removeFriend,
  searchUsers,
};