const mongoose = require('mongoose');
const { service: savingsService } = require('./src/modules/savings');
const User = require('./src/modules/auth/model');
const SavingsJar = require('./src/modules/savings/model');
const SavingsGoal = require('./src/modules/savings/goalModel');

async function testSavingsGoal() {
  console.log('--- Starting Periodic Savings Goal Tests ---');
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ai-expense-tracker-test';
  await mongoose.connect(mongoUri);

  try {
    let user = await User.findOne({ email: 'goal_test_user@example.com' });
    if (!user) {
      user = await User.create({
        fullName: 'Goal Test User',
        email: 'goal_test_user@example.com',
        password: 'Password123!',
      });
    }
    const userId = user._id.toString();

    // Cleanup
    await SavingsGoal.deleteOne({ user: userId });
    await SavingsJar.deleteMany({ user: userId });

    console.log('\n[Test 1] Fetch goal progress before setting any goal...');
    const initialProgress = await savingsService.getSavingsGoalProgress(userId);
    console.log('Initial Progress:', initialProgress);

    console.log('\n[Test 2] Set Monthly Savings Goal of ₹15,000...');
    const setGoalResult = await savingsService.setSavingsGoal(userId, {
      targetAmount: 15000,
      period: 'monthly',
      notes: 'Save 15k every month',
    });
    console.log('Goal Set Success:', setGoalResult.hasGoal);
    console.log('Goal Target:', setGoalResult.goal.targetAmount, 'Period:', setGoalResult.goal.period);

    console.log('\n[Test 3] Create Jar and Deposit ₹6,000 to test current period progress...');
    const jar = await savingsService.createJar(userId, { name: 'Goal Test Jar', icon: '🎯' });
    await savingsService.deposit(userId, jar._id, 6000, 'First deposit this month');

    const updatedProgress = await savingsService.getSavingsGoalProgress(userId);
    console.log('Saved in Period:', updatedProgress.goal.savedInPeriod);
    console.log('Percentage:', updatedProgress.goal.percentage + '%');
    console.log('Remaining:', updatedProgress.goal.remaining);

    console.log('\n[Test 4] Deposit remaining ₹9,000 to reach 100% target goal...');
    await savingsService.deposit(userId, jar._id, 9000, 'Second deposit to achieve goal');
    const finalProgress = await savingsService.getSavingsGoalProgress(userId);
    console.log('Final Percentage:', finalProgress.goal.percentage + '%');
    console.log('Is Goal Achieved:', finalProgress.goal.isGoalAchieved);

    // Cleanup
    await SavingsGoal.deleteOne({ user: userId });
    await SavingsJar.deleteMany({ user: userId });
    await User.deleteOne({ _id: userId });

    console.log('\n PERIODIC SAVINGS GOAL TESTS PASSED PERFECTLY!');
  } catch (err) {
    console.error(' Test failed:', err);
  } finally {
    await mongoose.disconnect();
  }
}

testSavingsGoal();
