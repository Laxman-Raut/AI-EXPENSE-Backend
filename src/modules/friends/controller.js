const friendService = require("./service");

const sendFriendRequest = async (req, res, next) => {
  try {
    const requesterId = req.user.userId;
    const { recipientId } = req.body;

    const request = await friendService.sendFriendRequest(
      requesterId,
      recipientId
    );

    res.status(201).json({
      success: true,
      message: "Friend request sent successfully.",
      data: request,
    });
  } catch (error) {
    next(error);
  }
};

const acceptFriendRequest = async (req, res, next) => {
  try {
    const { requestId } = req.body;

    const request = await friendService.acceptFriendRequest(requestId);

    res.status(200).json({
      success: true,
      message: "Friend request accepted.",
      data: request,
    });
  } catch (error) {
    next(error);
  }
};

const rejectFriendRequest = async (req, res, next) => {
  try {
    const { requestId } = req.body;

    const request = await friendService.rejectFriendRequest(requestId);

    res.status(200).json({
      success: true,
      message: "Friend request rejected.",
      data: request,
    });
  } catch (error) {
    next(error);
  }
};

const getPendingRequests = async (req, res, next) => {
  try {
    const requests = await friendService.getPendingRequests(req.user.userId);

    res.status(200).json({
      success: true,
      data: requests,
    });
  } catch (error) {
    next(error);
  }
};

const getFriends = async (req, res, next) => {
  try {
    const friends = await friendService.getFriends(req.user.userId);

    res.status(200).json({
      success: true,
      data: friends,
    });
  } catch (error) {
    next(error);
  }
};

const removeFriend = async (req, res, next) => {
  try {
    const { friendId } = req.params;

    await friendService.removeFriend(req.user.userId, friendId);

    res.status(200).json({
      success: true,
      message: "Friend removed successfully.",
    });
  } catch (error) {
    next(error);
  }
};

const searchUsers = async (req, res, next) => {
  try {
    const { q, query } = req.query;
    const searchTerm = q || query || "";
    const users = await friendService.searchUsers(searchTerm, req.user.userId);

    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    next(error);
  }
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