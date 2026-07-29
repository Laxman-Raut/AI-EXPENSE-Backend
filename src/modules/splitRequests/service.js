const splitRequestRepository = require("./repository");
const groupRepository = require("../groups/repository");
const Transaction = require("../transaction/model");

const getUserId = (userObj) => {
  if (!userObj) return "";
  if (typeof userObj === "object" && userObj._id) return userObj._id.toString();
  return userObj.toString();
};

// Create Split Request
const createSplitRequest = async (data, userId) => {
  const group = await groupRepository.getGroupById(data.group);

  if (!group) {
    throw new Error("Group not found");
  }

  const payerIdStr = getUserId(data.paidBy);
  const isPayerMember = group.members.some(
    (member) => getUserId(member) === payerIdStr
  );

  if (!isPayerMember) {
    throw new Error("Payer is not a member of this group");
  }

  for (const participant of data.participants) {
    const pUserIdStr = getUserId(participant.user);
    const exists = group.members.some(
      (member) => getUserId(member) === pUserIdStr
    );

    if (!exists) {
      throw new Error("One or more participants are not group members");
    }
  }

  const totalAmt = Number(data.totalAmount || data.amount || 0);
  data.totalAmount = totalAmt;

  const type = data.splitType || "equal";

  if (type === "equal") {
    const share = Number((totalAmt / data.participants.length).toFixed(2));
    data.participants = data.participants.map((p) => ({
      ...p,
      amount: share,
      status: getUserId(p.user) === payerIdStr ? "paid" : "pending",
    }));
  } else if (type === "exact") {
    data.participants = data.participants.map((p) => ({
      ...p,
      amount: Number(p.amount || 0),
      status: getUserId(p.user) === payerIdStr ? "paid" : "pending",
    }));
  } else if (type === "percentage") {
    data.participants = data.participants.map((p) => ({
      ...p,
      amount: Number(((totalAmt * (p.percentage || 0)) / 100).toFixed(2)),
      status: getUserId(p.user) === payerIdStr ? "paid" : "pending",
    }));
  } else if (type === "shares") {
    const totalShares = data.participants.reduce(
      (sum, p) => sum + Number(p.shares || 1),
      0
    );
    data.participants = data.participants.map((p) => {
      const shareCount = Number(p.shares || 1);
      return {
        ...p,
        amount: Number(((totalAmt * shareCount) / (totalShares || 1)).toFixed(2)),
        status: getUserId(p.user) === payerIdStr ? "paid" : "pending",
      };
    });
  }

  const createdSplit = await splitRequestRepository.createSplitRequest(data);

  // Automatically record Expense transaction for the payer
  try {
    await Transaction.create({
      user: payerIdStr,
      type: "expense",
      category: "Split Expense",
      description: `Paid for "${data.title}" in group`,
      amount: totalAmt,
      paymentMethod: "UPI",
      transactionDate: new Date(),
      note: `Split Request ID: ${createdSplit._id}`,
    });
  } catch (err) {
    console.error("[Split] Error creating initial expense transaction:", err.message);
  }

  return createdSplit;
};

// Get Group Split Requests
const getGroupSplitRequests = async (groupId) => {
  return await splitRequestRepository.getGroupSplitRequests(groupId);
};

// Get Split Request
const getSplitRequestById = async (splitId) => {
  const split = await splitRequestRepository.getSplitRequestById(splitId);
  if (!split) {
    throw new Error("Split request not found");
  }
  return split;
};

// Update
const updateSplitRequest = async (splitId, updateData, currentUserId) => {
  const oldSplit = await splitRequestRepository.getSplitRequestById(splitId);

  if (!oldSplit) {
    throw new Error("Split request not found");
  }

  // Authorization check for changing participant payment status
  if (currentUserId && updateData.participants && Array.isArray(updateData.participants)) {
    const splitPayerId = getUserId(oldSplit.paidBy);
    const currUserStr = currentUserId.toString();

    const isSplitCreator = splitPayerId === currUserStr;

    for (const newP of updateData.participants) {
      const pUserId = getUserId(newP.user);
      const oldP = oldSplit.participants.find(
        (op) => getUserId(op.user) === pUserId
      );

      if (oldP && oldP.status !== newP.status) {
        // If modifying someone else's payment status, user MUST be the Split Creator
        if (pUserId !== currUserStr && !isSplitCreator) {
          throw new Error("Only the creator of this split expense can mark members as paid");
        }
      }
    }
  }

  // Check for status changes to 'paid' to generate automatic Income & Expense transactions
  if (updateData.participants && Array.isArray(updateData.participants)) {
    const oldPayerId = getUserId(oldSplit.paidBy);

    for (const newP of updateData.participants) {
      const pUserId = getUserId(newP.user);
      const oldP = oldSplit.participants.find(
        (op) => getUserId(op.user) === pUserId
      );

      if (oldP && oldP.status !== "paid" && newP.status === "paid" && pUserId !== oldPayerId) {
        const shareAmount = Number(newP.amount || oldP.amount || 0);

        // 1) Record Income transaction for Payer (Reimbursement)
        try {
          await Transaction.create({
            user: oldPayerId,
            type: "income",
            category: "Split Reimbursement",
            description: `Received share for "${oldSplit.title}"`,
            amount: shareAmount,
            paymentMethod: "UPI",
            transactionDate: new Date(),
            note: `Reimbursement for Split ID: ${splitId}`,
          });
        } catch (err) {
          console.error("[Split] Error creating reimbursement income transaction:", err.message);
        }

        // 2) Record Expense transaction for Paying Participant
        try {
          await Transaction.create({
            user: pUserId,
            type: "expense",
            category: "Split Expense",
            description: `Paid share for "${oldSplit.title}"`,
            amount: shareAmount,
            paymentMethod: "UPI",
            transactionDate: new Date(),
            note: `Paid Split ID: ${splitId}`,
          });
        } catch (err) {
          console.error("[Split] Error creating payment expense transaction:", err.message);
        }
      }
    }
  }

  return await splitRequestRepository.updateSplitRequest(
    splitId,
    updateData
  );
};

// Delete
const deleteSplitRequest = async (splitId, currentUserId) => {
  const split = await splitRequestRepository.getSplitRequestById(splitId);

  if (!split) {
    throw new Error("Split request not found");
  }

  if (currentUserId) {
    const group = await groupRepository.getGroupById(split.group);
    const groupOwnerId = group ? getUserId(group.createdBy) : null;
    const splitPayerId = getUserId(split.paidBy);
    const currUserStr = currentUserId.toString();

    const isGroupAdmin = groupOwnerId === currUserStr;
    const isSplitCreator = splitPayerId === currUserStr;

    if (!isSplitCreator && !isGroupAdmin) {
      throw new Error("Only the creator of this expense or group admin can delete it");
    }
  }

  return await splitRequestRepository.deleteSplitRequest(splitId);
};

module.exports = {
  createSplitRequest,
  getGroupSplitRequests,
  getSplitRequestById,
  updateSplitRequest,
  deleteSplitRequest,
};