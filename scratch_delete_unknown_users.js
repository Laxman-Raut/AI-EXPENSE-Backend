const mongoose = require('mongoose');
require('dotenv').config({ path: 'C:/ExpenseAI/AI-EXPENSE-Backend/.env' });
const User = require('C:/ExpenseAI/AI-EXPENSE-Backend/src/modules/auth/model');

async function deleteUnknownUsers() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/expenseai');
  console.log("Connected to DB");

  // Query users where subscription.plan is null, undefined, or missing
  const unknownUsers = await User.find({
    $or: [
      { "subscription.plan": { $exists: false } },
      { "subscription.plan": null },
      { "subscription.plan": "" },
      { "subscription": { $exists: false } }
    ]
  });

  console.log(`Found ${unknownUsers.length} unknown user(s) to delete:`);
  unknownUsers.forEach(u => {
    console.log(`Deleting ID: ${u._id} | Name: ${u.fullName} | Email: ${u.email}`);
  });

  const ids = unknownUsers.map(u => u._id);
  const deleteResult = await User.deleteMany({ _id: { $in: ids } });
  console.log(`Successfully deleted ${deleteResult.deletedCount} unknown user account(s) from database.`);

  const remainingTotal = await User.countDocuments();
  console.log(`Remaining Total Users in DB: ${remainingTotal}`);

  await mongoose.disconnect();
}

deleteUnknownUsers().catch(err => console.error(err));
