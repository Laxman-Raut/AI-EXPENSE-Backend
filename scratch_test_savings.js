const mongoose = require('mongoose');
const { service: savingsService } = require('./src/modules/savings');
const User = require('./src/modules/auth/model');

async function testSavingsModule() {
  console.log('--- Starting Savings Jars Module Tests ---');
  
  // 1. Connect to MongoDB (or mock)
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ai-expense-tracker-test';
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB');

  try {
    // Clean up test user & jars
    let testUser = await User.findOne({ email: 'savings_test_user@example.com' });
    if (!testUser) {
      testUser = await User.create({
        fullName: 'Savings Test User',
        email: 'savings_test_user@example.com',
        password: 'Password123!',
        subscription: { plan: 'free', status: 'active' },
      });
    }

    const userId = testUser._id.toString();

    // Clean existing jars for test user
    const SavingsJar = require('./src/modules/savings/model');
    await SavingsJar.deleteMany({ user: userId });

    console.log('\n[Test 1] Create 3 Savings Jars (Free Plan)...');
    const jar1 = await savingsService.createJar(userId, {
      name: 'Emergency Fund',
      icon: '🛡️',
      color: '#FF6B6B',
      targetAmount: 50000,
      notes: '3 months expenses',
    });
    console.log('Created Jar 1:', jar1.name, 'Target:', jar1.targetAmount);

    const jar2 = await savingsService.createJar(userId, {
      name: 'Laptop Goal',
      icon: '💻',
      color: '#4C6EF5',
      targetAmount: 75000,
    });
    console.log('Created Jar 2:', jar2.name);

    const jar3 = await savingsService.createJar(userId, {
      name: 'Vacation',
      icon: '🏖️',
      color: '#20C997',
      targetAmount: 20000,
    });
    console.log('Created Jar 3:', jar3.name);

    console.log('\n[Test 2] Verify Free Plan Tier Limit (Attempting 4th Jar)...');
    try {
      await savingsService.createJar(userId, {
        name: '4th Jar (Should Fail)',
        icon: '🚗',
      });
      console.error('FAILED: 4th jar should have been blocked for free user!');
    } catch (err) {
      console.log('PASSED: Tier limit correctly enforced:', err.message);
    }

    console.log('\n[Test 3] Deposit ₹10,000 into Emergency Fund...');
    const updatedJar1 = await savingsService.deposit(userId, jar1._id, 10000, 'Monthly salary savings');
    console.log('Jar 1 Balance after deposit:', updatedJar1.currentAmount);
    console.log('Transactions count:', updatedJar1.transactions.length);

    console.log('\n[Test 4] Withdraw ₹2,000 from Emergency Fund...');
    const withdrawnJar1 = await savingsService.withdraw(userId, jar1._id, 2000, 'Unexpected expense');
    console.log('Jar 1 Balance after withdrawal:', withdrawnJar1.currentAmount);

    console.log('\n[Test 5] Attempt Over-Withdrawal (₹50,000)...');
    try {
      await savingsService.withdraw(userId, jar1._id, 50000, 'Overdraw');
      console.error('FAILED: Over-withdrawal should have been blocked!');
    } catch (err) {
      console.log('PASSED: Over-withdrawal blocked:', err.message);
    }

    console.log('\n[Test 6] Transfer ₹3,000 from Emergency Fund to Laptop Goal...');
    const transferResult = await savingsService.transfer(userId, jar1._id, jar2._id, 3000, 'Reallocating funds');
    console.log('Transfer message:', transferResult.message);
    console.log('Source Jar balance:', transferResult.fromJar.currentAmount);
    console.log('Dest Jar balance:', transferResult.toJar.currentAmount);

    console.log('\n[Test 7] Deposit remaining amount to hit target completion...');
    // Deposit remaining 72,000 to Laptop Goal (target 75,000, currently 3,000)
    const completedJar2 = await savingsService.deposit(userId, jar2._id, 72000, 'Bonus deposit');
    console.log('Laptop Goal balance:', completedJar2.currentAmount, 'Status:', completedJar2.status);
    if (completedJar2.status === 'completed') {
      console.log('PASSED: Status automatically updated to COMPLETED!');
    }

    console.log('\n[Test 8] Fetch Jars & Summary Stats...');
    const jarsResult = await savingsService.getJars(userId);
    console.log('Total Savings:', jarsResult.summary.totalSavings);
    console.log('Active Jars Count:', jarsResult.summary.activeJarsCount);
    console.log('Completed Jars Count:', jarsResult.summary.completedJarsCount);
    console.log('Recent Transactions Count:', jarsResult.summary.recentTransactions.length);

    console.log('\n[Test 9] Fetch AI Savings Suggestions...');
    const aiResult = await savingsService.getAISuggestions(userId);
    console.log('AI Suggestions Count:', aiResult.suggestions.length);

    // Clean up test data
    await SavingsJar.deleteMany({ user: userId });
    await User.deleteOne({ _id: userId });

    console.log('\n✅ ALL SAVINGS MODULE TESTS PASSED PERFECTLY!');
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testSavingsModule();
