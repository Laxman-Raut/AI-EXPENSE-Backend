const RecurringTransaction = require("./model");
const { createTransaction } = require("../transaction/service");
const { createNotification } = require("../notification/service");

// Calculate next execution date based on frequency
const calculateNextExecutionDate = (currentDate, frequency) => {
  const next = new Date(currentDate);
  if (frequency === "daily") {
    next.setDate(next.getDate() + 1);
  } else if (frequency === "weekly") {
    next.setDate(next.getDate() + 7);
  } else if (frequency === "monthly" || frequency === "emi") {
    next.setMonth(next.getMonth() + 1);
  } else if (frequency === "yearly") {
    next.setFullYear(next.getFullYear() + 1);
  }
  return next;
};

// Send reminders for recurring payments due within the next 24 hours
const sendUpcomingRecurringReminders = async () => {
  try {
    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const twentyHoursAgo = new Date(now.getTime() - 20 * 60 * 60 * 1000);

    // Find active recurring transactions due in next 24h that haven't received reminder recently
    const upcomingRecurring = await RecurringTransaction.find({
      status: "active",
      nextExecutionDate: { $gt: now, $lte: in24Hours },
      $or: [
        { lastReminderSentAt: { $exists: false } },
        { lastReminderSentAt: null },
        { lastReminderSentAt: { $lt: twentyHoursAgo } },
      ],
    });

    for (const item of upcomingRecurring) {
      try {
        const dueDate = new Date(item.nextExecutionDate);
        const dateStr = dueDate.toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
        });
        const isEmi = item.frequency === "emi" || item.totalInstallments > 0;
        const typeLabel = isEmi ? "EMI Payment" : "Recurring Payment";

        await createNotification({
          user: item.user,
          title: `🔔 Upcoming ${typeLabel} Due`,
          body: `Reminder: Your ${isEmi ? "EMI" : item.type} "${item.description}" of ₹${item.amount} (${item.category}) is due on ${dateStr}.`,
          type: "reminder",
          data: {
            screen: "RecurringTransactions",
            recurringId: item._id.toString(),
            amount: item.amount,
            category: item.category,
          },
        });

        // Record reminder sent
        await RecurringTransaction.updateOne(
          { _id: item._id },
          { $set: { lastReminderSentAt: now } }
        );

        console.log(`[Recurring Scheduler] Sent upcoming reminder for ${item._id} (${item.description})`);
      } catch (remErr) {
        console.error(`[Recurring Scheduler] Failed to send reminder for ${item._id}:`, remErr.message);
      }
    }
  } catch (error) {
    console.error("[Recurring Scheduler] Error in sendUpcomingRecurringReminders:", error.message);
  }
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

      const isEmi = item.frequency === "emi" || item.totalInstallments > 0;
      const newPaidCount = isEmi ? (item.paidInstallments || 0) + 1 : item.paidInstallments;
      const isCompleted = isEmi && item.totalInstallments && newPaidCount >= item.totalInstallments;

      // Atomic lock: update nextExecutionDate and paidInstallments
      const lockedItem = await RecurringTransaction.findOneAndUpdate(
        { _id: item._id, nextExecutionDate: item.nextExecutionDate },
        {
          nextExecutionDate: newNextDate,
          lastExecutedAt: now,
          paidInstallments: newPaidCount,
          ...(isCompleted ? { status: "completed" } : {}),
        },
        { new: true }
      );

      if (lockedItem) {
        console.log(`[Recurring Scheduler] Processing recurring transaction: ${item._id} (${item.description})`);
        
        try {
          // Create standard transaction using transaction service (triggers budget limits)
          const createdTx = await createTransaction(
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

          // Send confirmation notification for automated recurring execution
          try {
            const isEmi = item.frequency === "emi" || item.totalInstallments > 0;
            await createNotification({
              user: item.user,
              title: `⚡ Auto-Recorded: ${item.description}`,
              body: `Your recurring ${isEmi ? "EMI" : item.type} of ₹${item.amount} for "${item.description}" has been recorded for today.`,
              type: "reminder",
              data: {
                screen: "RecurringTransactions",
                recurringId: item._id.toString(),
                transactionId: createdTx?._id?.toString(),
              },
            });
          } catch (notifErr) {
            console.warn("[Recurring Scheduler] Notification warning:", notifErr.message);
          }
          
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
  sendUpcomingRecurringReminders();
  
  // Check due transactions every 30 seconds
  setInterval(processRecurringTransactions, 30000);

  // Check upcoming reminders every 60 seconds
  setInterval(sendUpcomingRecurringReminders, 60000);
};

module.exports = {
  startRecurringScheduler,
  calculateNextExecutionDate,
  sendUpcomingRecurringReminders,
};
