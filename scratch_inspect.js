const mongoose = require('mongoose');
require('dotenv').config({ path: 'C:/ExpenseAI/AI-EXPENSE-Backend/.env' });

const Plan = require('C:/ExpenseAI/AI-EXPENSE-Backend/src/modules/plan/model');
const Payment = require('C:/ExpenseAI/AI-EXPENSE-Backend/src/modules/payment/model');
const User = require('C:/ExpenseAI/AI-EXPENSE-Backend/src/modules/auth/model');

async function inspectData() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/expenseai');
  console.log("Connected to DB");

  const plans = await Plan.find();
  console.log("=== PLANS ===");
  console.log(plans.map(p => ({ id: p._id, name: p.name, slug: p.slug, price: p.price, status: p.status })));

  const payments = await Payment.find();
  console.log("=== PAYMENTS COUNT ===", payments.length);
  console.log(payments.map(p => ({ id: p._id, plan: p.plan, amount: p.amount, status: p.status, paidAt: p.paidAt })));

  const users = await User.find();
  console.log("=== USERS COUNT ===", users.length);
  const planUserCounts = {};
  users.forEach(u => {
    const plan = u.subscription?.plan || 'free';
    planUserCounts[plan] = (planUserCounts[plan] || 0) + 1;
  });
  console.log("=== USER PLAN DISTRIBUTION ===", planUserCounts);

  await mongoose.disconnect();
}

inspectData().catch(err => console.error(err));
