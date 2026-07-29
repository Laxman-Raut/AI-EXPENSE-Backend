const mongoose = require('mongoose');
require('dotenv').config({ path: 'C:/ExpenseAI/AI-EXPENSE-Backend/.env' });
const User = require('C:/ExpenseAI/AI-EXPENSE-Backend/src/modules/auth/model');

async function fixAccountStatus() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/expenseai');
  console.log("Connected to DB");

  const result = await User.updateMany(
    {
      $or: [
        { accountStatus: { $exists: false } },
        { accountStatus: null },
        { accountStatus: "" }
      ]
    },
    {
      $set: { accountStatus: "active" }
    }
  );

  console.log(`Updated ${result.modifiedCount} user(s) accountStatus to 'active'.`);

  const statusDist = await User.aggregate([
    { $group: { _id: "$accountStatus", count: { $sum: 1 } } }
  ]);
  console.log("\nNew Account Status Distribution from DB:", JSON.stringify(statusDist, null, 2));

  await mongoose.disconnect();
}

fixAccountStatus().catch(err => console.error(err));
