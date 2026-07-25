const friendRepository = require("./repository");
const User = require("../auth/model");

const sendFriendRequest = async (requesterId, recipientId) => {
  // Can't send request to yourself
  if (requesterId === recipientId) {
    throw new Error("You cannot send a friend request to yourself.");
  }

  // Check recipient exists
  const recipient = await User.findById(recipientId);

  if (!recipient) {
    throw new Error("User not found.");
  }

  // Check existing relationship
  const existing = await friendRepository.findExistingFriendship(
    requesterId,
    recipientId
  );

  if (existing) {
    switch (existing.status) {
      case "pending":
        throw new Error("Friend request already pending.");

      case "accepted":
        throw new Error("You are already friends.");

      case "rejected":
        throw new Error("Friend request was already rejected.");
    }
  }

  return friendRepository.createRequest({
    sender: requesterId,
    receiver: recipientId,
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

  return friendRepository.updateRequestStatus(requestId, "accepted");
};

const rejectFriendRequest = async (requestId) => {
  const request = await friendRepository.findById(requestId);

  if (!request) {
    throw new Error("Friend request not found.");
  }

  if (request.status !== "pending") {
    throw new Error("This request has already been processed.");
  }

  return friendRepository.updateRequestStatus(requestId, "rejected");
};

const getPendingRequests = async (userId) => {
  return friendRepository.getPendingRequests(userId);
};

const getFriends = async (userId) => {
  return friendRepository.getFriends(userId);
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