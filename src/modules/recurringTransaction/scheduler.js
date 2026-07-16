const RecurringTransaction = require("./model");
const { createTransaction } = require("../transaction/service");

// Calculate next execution date based on frequency
const calculateNextExecutionDate = (currentDate, frequency) => {
  const next = new Date(currentDate);
  if (frequency === "daily") {
    next.setDate(next.getDate() + 1);
  } else if (frequency === "weekly") {
    next.setDate(next.getDate() + 7);
  } else if (frequency === "monthly") {
    next.setMonth(next.getMonth() + 1);
  } else if (frequency === "yearly") {
    next.setFullYear(next.getFullYear() + 1);
  }
  return next;
};

// Process due recurring transactions
const processRecurringTransactions = async () => {
  try {
    const now = new Date();
    
    // Find all active recurring transactions that are due (nextExecutionDate <= now)
    const dueRecurring = await RecurringTransaction.find({
      status: "active",
      nextExecutionDate: { $lte: now },
    });

    if (dueRecurring.length > 0) {
      console.log(`[Recurring Scheduler] Found ${dueRecurring.length} recurring transactions to process.`);
    }

    for (const item of dueRecurring) {
      const nextDate = new Date(item.nextExecutionDate);
      const newNextDate = calculateNextExecutionDate(nextDate, item.frequency);

      // Atomic lock: update nextExecutionDate only if it matches what we retrieved
      // This prevents duplicate generation if multiple scheduler ticks or workers run concurrently
      const lockedItem = await RecurringTransaction.findOneAndUpdate(
        { _id: item._id, nextExecutionDate: item.nextExecutionDate },
        {
          nextExecutionDate: newNextDate,
          lastExecutedAt: now,
        },
        { new: true }
      );

      if (lockedItem) {
        console.log(`[Recurring Scheduler] Processing recurring transaction: ${item._id} (${item.description})`);
        
        try {
          // Create standard transaction using transaction service (triggers budget limits and notifications)
          await createTransaction(
            {
              type: item.type,
              category: item.category,
              amount: item.amount,
              description: item.description,
              paymentMethod: item.paymentMethod,
              note: item.note,
              transactionDate: nextDate, // set date to when it was scheduled
            },
            item.user
          );
          
          console.log(`[Recurring Scheduler] Successfully generated transaction for recurring template: ${item._id}`);
        } catch (txnError) {
          console.error(`[Recurring Scheduler] Error creating transaction for recurring template ${item._id}:`, txnError);
        }
      }
    }
  } catch (error) {
    console.error("[Recurring Scheduler] Error in recurring scheduler run:", error);
  }
};

const startRecurringScheduler = () => {
  console.log("[Recurring Scheduler] Background recurring transactions scheduler started.");
  
  // Run once immediately on start
  processRecurringTransactions();
  
  // Check every 30 seconds
  setInterval(processRecurringTransactions, 30000);
};

module.exports = {
  startRecurringScheduler,
  calculateNextExecutionDate,
};
