const mongoose = require('mongoose');
require('dotenv').config({ path: 'C:/ExpenseAI/AI-EXPENSE-Backend/.env' });
const User = require('C:/ExpenseAI/AI-EXPENSE-Backend/src/modules/auth/model');
const Payment = require('C:/ExpenseAI/AI-EXPENSE-Backend/src/modules/payment/model');

async function fullAudit() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/expenseai');
  
  const users = await User.find().lean();
  console.log("=================== ALL USERS IN DB (" + users.length + ") ===================");
  users.forEach((u, i) => {
    console.log(`${i+1}. ID: ${u._id} | Name: ${u.fullName} | Email: ${u.email} | Plan: ${u.subscription?.plan} | SubStatus: ${u.subscription?.status} | AccStatus: ${u.accountStatus}`);
  });

  const payments = await Payment.find({ status: 'success' }).lean();
  console.log("\n=================== ALL SUCCESSFUL PAYMENTS (" + payments.length + ") ===================");
  const payingUserIds = new Set();
  payments.forEach((p, i) => {
    payingUserIds.add(p.userId.toString());
    console.log(`${i+1}. Payment ID: ${p._id} | UserID: ${p.userId} | Amount: ${p.amount} | Plan: ${p.plan} | Date: ${p.paidAt}`);
  });

  console.log("\n=================== UNIQUE PAYING USER IDS (" + payingUserIds.size + ") ===================");
  payingUserIds.forEach(id => {
    const userObj = users.find(u => u._id.toString() === id);
    console.log(`User ID: ${id} | Name: ${userObj ? userObj.fullName : 'UNKNOWN'} | Email: ${userObj ? userObj.email : 'UNKNOWN'}`);
  });

  await mongoose.disconnect();
}

fullAudit().catch(err => console.error(err));
