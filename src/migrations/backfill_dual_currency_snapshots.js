const mongoose = require("mongoose");
const path = require("path");
const backendPath = "C:/ExpenseAI/AI-EXPENSE-Backend";
require(path.join(backendPath, "node_modules/dotenv")).config({ path: path.join(backendPath, ".env") });

const Transaction = require("../modules/transaction/model");
const SavingsJar = require("../modules/savings/model");
const RecurringTransaction = require("../modules/recurringTransaction/model");
const SplitRequest = require("../modules/splitRequests/model");
const { getRatesMap, getUsdInrExchangeRate, roundCurrency } = require("../modules/currency/service");

async function runMigration() {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://localhost:27017/expense_ai";
    console.log("Connecting to MongoDB for dual-currency snapshot migration...");
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB.");

    const ratesMap = await getRatesMap();
    const rate = getUsdInrExchangeRate(ratesMap) || 90.0;
    console.log(`Using live/fallback exchange rate for backfill: 1 USD = ${rate} INR`);

    // 1. Backfill Transactions
    console.log("\n--- 1. Backfilling Transactions ---");
    const txs = await Transaction.find({
      $or: [
        { amountINR: { $exists: false } },
        { amountINR: null },
        { amountUSD: { $exists: false } },
        { amountUSD: null },
      ]
    });
    console.log(`Found ${txs.length} transactions requiring snapshot backfill.`);

    let txUpdated = 0;
    for (const tx of txs) {
      const origAmt = Number(tx.amount || 0);
      const origCurr = String(tx.currency || "INR").toUpperCase().trim() === "USD" ? "USD" : "INR";

      let amountINR = 0;
      let amountUSD = 0;

      if (origCurr === "INR") {
        amountINR = roundCurrency(origAmt, "INR");
        amountUSD = roundCurrency(origAmt / rate, "USD");
      } else {
        amountUSD = roundCurrency(origAmt, "USD");
        amountINR = roundCurrency(origAmt * rate, "INR");
      }

      tx.originalAmount = tx.originalAmount || origAmt;
      tx.originalCurrency = tx.originalCurrency || origCurr;
      tx.amountINR = amountINR;
      tx.amountUSD = amountUSD;
      tx.exchangeRate = tx.exchangeRate || rate;
      tx.exchangeRateTimestamp = tx.exchangeRateTimestamp || tx.createdAt || new Date();

      await tx.save();
      txUpdated++;
    }
    console.log(`Successfully updated ${txUpdated} transactions.`);

    // 2. Backfill Savings Jars
    console.log("\n--- 2. Backfilling Savings Jars ---"); 
    const jars = await SavingsJar.find({});
    let jarsUpdated = 0;
    for (const jar of jars) {
      const target = Number(jar.targetAmount || 0);
      const current = Number(jar.currentAmount || 0);
      const curr = String(jar.originalCurrency || "INR").toUpperCase().trim() === "USD" ? "USD" : "INR";

      if (curr === "INR") {
        jar.targetAmountINR = target;
        jar.targetAmountUSD = roundCurrency(target / rate, "USD");
        jar.currentAmountINR = current;
        jar.currentAmountUSD = roundCurrency(current / rate, "USD");
      } else {
        jar.targetAmountUSD = target;
        jar.targetAmountINR = roundCurrency(target * rate, "INR");
        jar.currentAmountUSD = current;
        jar.currentAmountINR = roundCurrency(current * rate, "INR");
      }
      jar.exchangeRate = jar.exchangeRate || rate;
      jar.exchangeRateTimestamp = jar.exchangeRateTimestamp || jar.createdAt || new Date();

      await jar.save();
      jarsUpdated++;
    }
    console.log(`Successfully updated ${jarsUpdated} savings jars.`);

    // 3. Backfill Recurring Transactions
    console.log("\n--- 3. Backfilling Recurring Transactions ---");
    const recurrings = await RecurringTransaction.find({});
    let recUpdated = 0;
    for (const rec of recurrings) {
      const amt = Number(rec.amount || 0);
      const curr = String(rec.currency || "INR").toUpperCase().trim() === "USD" ? "USD" : "INR";

      if (curr === "INR") {
        rec.amountINR = roundCurrency(amt, "INR");
        rec.amountUSD = roundCurrency(amt / rate, "USD");
      } else {
        rec.amountUSD = roundCurrency(amt, "USD");
        rec.amountINR = roundCurrency(amt * rate, "INR");
      }
      rec.originalAmount = rec.originalAmount || amt;
      rec.originalCurrency = rec.originalCurrency || curr;
      rec.exchangeRate = rec.exchangeRate || rate;
      rec.exchangeRateTimestamp = rec.exchangeRateTimestamp || rec.createdAt || new Date();

      await rec.save();
      recUpdated++;
    }
    console.log(`Successfully updated ${recUpdated} recurring transactions.`);

    // 4. Backfill Split Requests
    console.log("\n--- 4. Backfilling Split Requests ---");
    const splits = await SplitRequest.find({});
    let splitUpdated = 0;
    for (const split of splits) {
      const tot = Number(split.totalAmount || 0);
      const curr = String(split.currency || "INR").toUpperCase().trim() === "USD" ? "USD" : "INR";

      if (curr === "INR") {
        split.totalAmountINR = tot;
        split.totalAmountUSD = roundCurrency(tot / rate, "USD");
      } else {
        split.totalAmountUSD = tot;
        split.totalAmountINR = roundCurrency(tot * rate, "INR");
      }
      split.originalCurrency = curr;
      split.exchangeRate = split.exchangeRate || rate;
      split.exchangeRateTimestamp = split.exchangeRateTimestamp || split.createdAt || new Date();

      if (split.participants && split.participants.length > 0) {
        split.participants.forEach((p) => {
          const pAmt = Number(p.amount || 0);
          if (curr === "INR") {
            p.amountINR = pAmt;
            p.amountUSD = roundCurrency(pAmt / rate, "USD");
          } else {
            p.amountUSD = pAmt;
            p.amountINR = roundCurrency(pAmt * rate, "INR");
          }
        });
      }

      await split.save();
      splitUpdated++;
    }
    console.log(`Successfully updated ${splitUpdated} split requests.`);

    console.log("\n✅ DUAL-CURRENCY SNAPSHOT MIGRATION COMPLETE.");
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

runMigration();
