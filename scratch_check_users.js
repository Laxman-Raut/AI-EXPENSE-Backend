const mongoose = require('mongoose');
require('dotenv').config({ path: 'C:/ExpenseAI/AI-EXPENSE-Backend/.env' });
const User = require('C:/ExpenseAI/AI-EXPENSE-Backend/src/modules/auth/model');

async function checkActiveUsers() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/expenseai');
  const users = await User.find().lean();
  
  console.log("Total users in DB:", users.length);
  
  users.forEach((u, index) => {
    const plan = u.subscription?.plan || 'free';
    const subStatus = u.subscription?.status || 'inactive';
    const accStatus = u.accountStatus || 'active';
    
    const isPaid = plan !== 'free' && plan !== 'none';
    const isUsersPageActive = accStatus !== 'suspended' && isPaid && subStatus === 'active';
    
    console.log(`${index+1}. ${u.fullName} (${u.email}) | Plan: ${plan} | SubStatus: ${subStatus} | AccStatus: ${accStatus} => UsersPageActive: ${isUsersPageActive}`);
  });

  const query1 = await User.countDocuments({ "subscription.plan": "pro", "subscription.status": "active" });
  const query2 = await User.countDocuments({ "subscription.plan": { $ne: "free" }, "subscription.status": "active", "accountStatus": { $ne: "suspended" } });
  
  console.log("\nOld getPremiumUsers query (plan == 'pro'):", query1);
  console.log("Correct Paid Active Users query (plan != 'free' & subStatus == 'active' & accStatus != 'suspended'):", query2);

  await mongoose.disconnect();
}

checkActiveUsers().catch(err => console.error(err));
