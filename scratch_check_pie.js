const mongoose = require('mongoose');
require('dotenv').config({ path: 'C:/ExpenseAI/AI-EXPENSE-Backend/.env' });
const Payment = require('C:/ExpenseAI/AI-EXPENSE-Backend/src/modules/payment/model');
const { getRevenueByPlan } = require('C:/ExpenseAI/AI-EXPENSE-Backend/src/modules/admin/repository');

async function checkPie() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/expenseai');
  
  const data = await getRevenueByPlan();
  console.log("getRevenueByPlan from DB:", JSON.stringify(data, null, 2));

  await mongoose.disconnect();
}

checkPie().catch(err => console.error(err));
