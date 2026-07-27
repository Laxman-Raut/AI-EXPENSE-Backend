const splitRequestService = require("./service");

const getUserId = (req) => req.user?.userId || req.user?.id || req.user?._id;

// Create Split Request
const createSplitRequest = async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const splitRequest = await splitRequestService.createSplitRequest(
      req.body,
      userId
    );

    return res.status(201).json({
      success: true,
      message: "Split request created successfully",
      data: splitRequest,
    });
  } catch (error) {
    next(error);
  }
};

// Get Group Split Requests
const getGroupSplitRequests = async (req, res, next) => {
  try {
    const splitRequests =
      await splitRequestService.getGroupSplitRequests(
        req.params.groupId
      );

    return res.status(200).json({
      success: true,
      data: splitRequests,
    });
  } catch (error) {
    next(error);
  }
};

// Get Single Split Request
const getSplitRequestById = async (req, res, next) => {
  try {
    const splitRequest =
      await splitRequestService.getSplitRequestById(
        req.params.splitId
      );

    return res.status(200).json({
      success: true,
      data: splitRequest,
    });
  } catch (error) {
    next(error);
  }
};

// Update Split Request
const updateSplitRequest = async (req, res, next) => {
  try {
    const splitRequest =
      await splitRequestService.updateSplitRequest(
        req.params.splitId,
        req.body
      );

    return res.status(200).json({
      success: true,
      message: "Split request updated successfully",
      data: splitRequest,
    });
  } catch (error) {
    next(error);
  }
};

// Delete Split Request
const deleteSplitRequest = async (req, res, next) => {
  try {
    await splitRequestService.deleteSplitRequest(
      req.params.splitId
    );

    return res.status(200).json({
      success: true,
      message: "Split request deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createSplitRequest,
  getGroupSplitRequests,
  getSplitRequestById,
  updateSplitRequest,
  deleteSplitRequest,
};