const mongoose = require("mongoose");
const Transaction = require("../transaction/model");

// Helper to get start and end dates of a month
const getMonthDateRange = (year, month) => {
  const start = new Date(`${year}-${month.toString().padStart(2, '0')}-01T00:00:00.000Z`);
  const end = new Date(new Date(start).setUTCMonth(start.getUTCMonth() + 1, 0));
  end.setUTCHours(23, 59, 59, 999);
  return { start, end };
};

// Feature 1: Daily Transactions
const getDailyTransactions = async (date, userId) => {
  const startOfDay = new Date(`${date}T00:00:00.000Z`);
  const endOfDay = new Date(`${date}T23:59:59.999Z`);

  return await Transaction.find({
    user: userId,
    transactionDate: { $gte: startOfDay, $lte: endOfDay }
  }).sort({ transactionDate: -1 });
};

// Feature 2: Monthly Calendar Summary
const getMonthlySummary = async (year, month, userId) => {
  const { start, end } = getMonthDateRange(year, month);

  return await Transaction.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        transactionDate: { $gte: start, $lte: end }
      }
    },
    {
      $project: {
        dateStr: { $dateToString: { format: "%Y-%m-%d", date: "$transactionDate", timezone: "UTC" } },
        amount: 1,
        type: 1
      }
    },
    {
      $group: {
        _id: "$dateStr",
        income: {
          $sum: { $cond: [{ $eq: ["$type", "income"] }, "$amount", 0] }
        },
        expense: {
          $sum: { $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0] }
        },
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        _id: 0,
        date: "$_id",
        income: 1,
        expense: 1,
        count: 1
      }
    },
    {
      $sort: { date: 1 }
    }
  ]);
};

// Feature 3: Calendar Statistics
const getCalendarStats = async (year, month, userId) => {
  const dailySummaries = await getMonthlySummary(year, month, userId);
  
  let totalIncome = 0;
  let totalExpense = 0;
  let totalTransactions = 0;
  let highestSpendingDay = { date: null, amount: 0 };
  let highestIncomeDay = { date: null, amount: 0 };

  dailySummaries.forEach(day => {
    totalIncome += day.income;
    totalExpense += day.expense;
    totalTransactions += day.count;

    if (day.expense > highestSpendingDay.amount) {
      highestSpendingDay = { date: day.date, amount: day.expense };
    }
    if (day.income > highestIncomeDay.amount) {
      highestIncomeDay = { date: day.date, amount: day.income };
    }
  });

  const numDaysInMonth = new Date(year, month, 0).getDate();
  const avgDailyExpense = Number((totalExpense / numDaysInMonth).toFixed(2));
  const avgDailyIncome = Number((totalIncome / numDaysInMonth).toFixed(2));

  return {
    totalIncome,
    totalExpense,
    totalTransactions,
    highestSpendingDay: highestSpendingDay.date ? highestSpendingDay : null,
    highestIncomeDay: highestIncomeDay.date ? highestIncomeDay : null,
    avgDailyExpense,
    avgDailyIncome
  };
};

// Feature 4: Calendar Timeline
const getCalendarTimeline = async (startDate, endDate, userId) => {
  const transactions = await Transaction.find({
    user: userId,
    transactionDate: {
      $gte: new Date(`${startDate}T00:00:00.000Z`),
      $lte: new Date(`${endDate}T23:59:59.999Z`)
    }
  }).sort({ transactionDate: -1 });

  const timeline = {};
  transactions.forEach(t => {
    const dateStr = t.transactionDate.toISOString().split('T')[0];
    if (!timeline[dateStr]) {
      timeline[dateStr] = [];
    }
    timeline[dateStr].push(t);
  });

  return timeline;
};

// Feature 5: Daily Summary
const getDailySummary = async (date, userId) => {
  const startOfDay = new Date(`${date}T00:00:00.000Z`);
  const endOfDay = new Date(`${date}T23:59:59.999Z`);

  const transactions = await Transaction.find({
    user: userId,
    transactionDate: { $gte: startOfDay, $lte: endOfDay }
  });

  let income = 0;
  let expense = 0;

  transactions.forEach(t => {
    if (t.type === "income") {
      income += t.amount;
    } else {
      expense += t.amount;
    }
  });

  return {
    date,
    income,
    expense,
    balance: income - expense,
    transactionCount: transactions.length
  };
};

// Feature 6: Calendar Heat Map
const getCalendarHeatmap = async (year, month, userId) => {
  const dailySummaries = await getMonthlySummary(year, month, userId);

  return dailySummaries.map(day => {
    let level = "Low";
    if (day.count > 5) {
      level = "High";
    } else if (day.count > 2) {
      level = "Medium";
    }

    return {
      date: day.date,
      expense: day.expense,
      income: day.income,
      transactions: day.count,
      level
    };
  });
};

module.exports = {
  getDailyTransactions,
  getMonthlySummary,
  getCalendarStats,
  getCalendarTimeline,
  getDailySummary,
  getCalendarHeatmap
};