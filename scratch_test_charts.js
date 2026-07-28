const mongoose = require('mongoose');
require('dotenv').config({ path: 'C:/ExpenseAI/AI-EXPENSE-Backend/.env' });
const { getRevenueTrend, getRevenueByPlan } = require('C:/ExpenseAI/AI-EXPENSE-Backend/src/modules/admin/repository');

async function testCharts() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/expenseai');
  console.log("Connected to DB");

  const trend = await getRevenueTrend();
  console.log("=== REVENUE TREND ===");
  console.log(JSON.stringify(trend, null, 2));

  const pie = await getRevenueByPlan();
  console.log("=== REVENUE BY PLAN ===");
  console.log(JSON.stringify(pie, null, 2));

  await mongoose.disconnect();
}

testCharts().catch(err => console.error(err));
