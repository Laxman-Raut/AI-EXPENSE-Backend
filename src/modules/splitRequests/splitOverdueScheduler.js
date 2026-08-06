const SplitRequest = require("./model");
const Transaction = require("../transaction/model");

const getUserId = (userObj) => {
  if (!userObj) return "";
  if (typeof userObj === "object" && userObj._id) return userObj._id.toString();
  return userObj.toString();
};

const processOverdueSplitRequests = async () => {
  try {
    const now = new Date();
    // Find all split requests that are pending and whose due date has passed
    const overdueSplits = await SplitRequest.find({
      status: "pending",
      dueDate: { $lt: now },
      overdueProcessed: false,
    })
      .populate("paidBy", "fullName email")
      .populate("participants.user", "fullName email");

    if (overdueSplits.length === 0) return;

    for (const split of overdueSplits) {
      const payerId = getUserId(split.paidBy);
      const payerName = split.paidBy?.fullName || "Payer";
      const payerEmail = split.paidBy?.email || "";

      for (let i = 0; i < split.participants.length; i++) {
        const p = split.participants[i];
        const pUserId = getUserId(p.user);
        const participantName = p.user?.fullName || "Group Member";
        const participantEmail = p.user?.email || "";

        if (p.status === "pending" && pUserId !== payerId) {
          const shareAmt = Number(p.amount || 0);

          // 1) Record Expense for the overdue participant with their name reference
          try {
            await Transaction.create({
              user: pUserId,
              type: "expense",
              category: "Overdue Split Expense",
              description: `Overdue Split: "${split.title}" (Due date missed)`,
              amount: shareAmt,
              paymentMethod: "UPI",
              transactionDate: now,
              note: `Unpaid split share for "${split.title}". Payer: ${payerName} (${payerEmail})`,
            });
          } catch (err) {
            console.error("[Overdue Scheduler] Error creating overdue expense:", err.message);
          }

          // 2) Record Income for the recipient (Payer) with participant name reference
          try {
            await Transaction.create({
              user: payerId,
              type: "income",
              category: "Split Reimbursement",
              description: `Overdue Share from ${participantName} for "${split.title}"`,
              amount: shareAmt,
              paymentMethod: "UPI",
              transactionDate: now,
              note: `Auto-settled overdue share from ${participantName} (${participantEmail})`,
            });
          } catch (err) {
            console.error("[Overdue Scheduler] Error creating overdue reimbursement:", err.message);
          }

          p.status = "paid";
        }
      }

      split.overdueProcessed = true;
      const allPaid = split.participants.every((p) => p.status === "paid");
      if (allPaid) {
        split.status = "completed";
      }

      await split.save();
    }
  } catch (error) {
    console.error("[Overdue Scheduler] Error processing overdue splits:", error.message);
  }
};

const startSplitOverdueScheduler = () => {
  console.log("[Split Scheduler] Overdue split request scheduler started.");
  // Run check on startup
  processOverdueSplitRequests();
  // Check every 6 hours
  setInterval(processOverdueSplitRequests, 6 * 60 * 60 * 1000);
};

module.exports = {
  startSplitOverdueScheduler,
  processOverdueSplitRequests,
};
