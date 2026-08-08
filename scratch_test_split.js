const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = require("./src/config/db");
const Group = require("./src/modules/groups/model");
const splitRequestService = require("./src/modules/splitRequests/service");

async function runTest() {
  console.log("Connecting to database...");
  await connectDB();

  console.log("Fetching a group with members...");
  const group = await Group.findOne({ "members.1": { $exists: true } });
  
  if (!group) {
    console.error("No group found in the database. Please create a group first.");
    await mongoose.disconnect();
    return;
  }

  console.log(`Found group: "${group.name}" with ID: ${group._id}`);
  console.log(`Members count: ${group.members.length}`);

  const creatorId = group.createdBy;
  console.log(`Creator ID: ${creatorId}`);

  // Construct mock split payload
  const payload = {
    group: group._id.toString(),
    title: "Test Diagnostic Split",
    description: "Diagnostic split to find backend errors",
    totalAmount: 100 * group.members.length,
    amount: 100 * group.members.length,
    paidBy: creatorId.toString(),
    splitType: "equal",
    participants: group.members.map((memberId) => ({
      user: memberId.toString(),
    })),
  };

  console.log("Attempting to create split request...");
  try {
    const result = await splitRequestService.createSplitRequest(payload, creatorId.toString());
    console.log("✅ Success! Split request created successfully:");
    console.log(result);
  } catch (error) {
    console.error("❌ Error! Split request creation failed:");
    console.error(error.stack || error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from database.");
  }
}

runTest();
