const mongoose = require('mongoose');
require('dotenv').config({ path: 'C:/ExpenseAI/AI-EXPENSE-Backend/.env' });
const User = require('C:/ExpenseAI/AI-EXPENSE-Backend/src/modules/auth/model');

async function checkVerification() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/expenseai');
  
  const users = await User.find().lean();
  console.log("=================== ALL 13 REMAINING USERS IN DB ===================");
  users.forEach((u, i) => {
    console.log(`${i+1}. Name: ${u.fullName} | Email: ${u.email} | isVerified: ${u.isVerified} | accountStatus: ${u.accountStatus}`);
  });

  const verifiedCount = await User.countDocuments({ isVerified: true });
  const unverifiedCount = await User.countDocuments({ isVerified: false });

  console.log(`\nVerified Count (isVerified === true): ${verifiedCount}`);
  console.log(`Unverified Count (isVerified === false/undefined): ${unverifiedCount}`);

  const statusDist = await User.aggregate([
    { $group: { _id: "$accountStatus", count: { $sum: 1 } } }
  ]);
  console.log("\nAccount Status Distribution from DB:", JSON.stringify(statusDist, null, 2));

  await mongoose.disconnect();
}

checkVerification().catch(err => console.error(err));
