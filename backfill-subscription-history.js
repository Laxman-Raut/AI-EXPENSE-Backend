const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const dns = require("dns");

dns.setServers(["8.8.8.8", "1.1.1.1"]);

dotenv.config({ path: path.join(__dirname, ".env") });

const User = require("./src/modules/auth/model");
const Plan = require("./src/modules/plan/model");
const Payment = require("./src/modules/payment/model");
const SubscriptionHistory = require("./src/modules/subscription-history/model");

async function backfillSubscriptionHistory() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("Error: MONGODB_URI is not defined in .env");
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log("Connected to MongoDB successfully.");

    // Fetch existing plans
    let plans = await Plan.find({});
    console.log(`Found ${plans.length} plans in database.`);

    const freePlan = plans.find((p) => p.slug === "free") || null;
    const proPlan = plans.find((p) => p.slug === "pro") || null;

    let createdCount = 0;

    // 1. Backfill from successful payments
    const successfulPayments = await Payment.find({ status: "success" });
    console.log(`Found ${successfulPayments.length} successful payment records.`);

    for (const payment of successfulPayments) {
      const existingHistory = await SubscriptionHistory.findOne({ paymentId: payment._id });
      if (!existingHistory) {
        const planObj = payment.plan && payment.plan.includes("pro") ? proPlan : (freePlan || proPlan);
        await SubscriptionHistory.create({
          userId: payment.userId,
          planId: planObj ? planObj._id : null,
          paymentId: payment._id,
          action: "activated",
          provider: payment.provider || "razorpay",
          startDate: payment.paidAt || payment.createdAt || new Date(),
          endDate: null,
          amount: payment.amount || 0,
          currency: payment.currency || "INR",
          note: `Backfilled from successful payment record (${payment.plan}).`,
          createdAt: payment.createdAt || new Date(),
        });
        createdCount++;
      }
    }

    // 2. Backfill for users without any history entries
    const allUsers = await User.find({});
    console.log(`Found ${allUsers.length} total users in database.`);

    for (const user of allUsers) {
      const userHistoryCount = await SubscriptionHistory.countDocuments({ userId: user._id });
      if (userHistoryCount === 0) {
        const isPro = user.subscription && user.subscription.plan === "pro";
        const targetPlan = isPro ? (proPlan || freePlan) : freePlan;

        await SubscriptionHistory.create({
          userId: user._id,
          planId: targetPlan ? targetPlan._id : null,
          action: "activated",
          provider: user.subscription?.provider || "system",
          startDate: user.subscription?.startDate || user.createdAt || new Date(),
          endDate: user.subscription?.endDate || null,
          amount: isPro ? (targetPlan?.price || 199) : 0,
          currency: targetPlan?.currency || "INR",
          note: `Backfilled initial ${isPro ? "Pro" : "Free"} subscription history for existing user.`,
          createdAt: user.createdAt || new Date(),
        });
        createdCount++;
      }
    }

    console.log(`\nSuccess! Backfilled ${createdCount} new SubscriptionHistory records.`);
  } catch (error) {
    console.error("Error backfilling subscription history:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
}

backfillSubscriptionHistory();
