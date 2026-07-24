const User = require("../auth/model");
const Payment = require("../payment/model");
const Plan = require("../plan/model");
const SubscriptionHistory = require("../subscription-history/model");
const Transaction = require("../transaction/model");

// ======================================
// Summary Report: Key SaaS KPIs
// ======================================

const getReportSummary = async () => {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  // Total users
  const totalUsers = await User.countDocuments();
  const newUsersThisMonth = await User.countDocuments({ createdAt: { $gte: monthStart, $lte: monthEnd } });
  const newUsersLastMonth = await User.countDocuments({ createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd } });

  // Active subscribers (all non-free paid plans)
  const activeSubscribers = await User.countDocuments({
    "subscription.plan": { $ne: "free" },
    "subscription.status": "active",
  });

  // Revenue
  const revenueAgg = await Payment.aggregate([
    { $match: { status: "success" } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);
  const totalRevenue = revenueAgg[0]?.total || 0;

  const monthlyRevenueAgg = await Payment.aggregate([
    { $match: { status: "success", paidAt: { $gte: monthStart, $lte: monthEnd } } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);
  const monthlyRevenue = monthlyRevenueAgg[0]?.total || 0;

  const lastMonthRevenueAgg = await Payment.aggregate([
    { $match: { status: "success", paidAt: { $gte: lastMonthStart, $lte: lastMonthEnd } } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);
  const lastMonthRevenue = lastMonthRevenueAgg[0]?.total || 0;

  // Transactions
  const totalTransactions = await Transaction.countDocuments();

  // Plans
  const activePlans = await Plan.countDocuments({ status: "active", isCurrent: true });

  return {
    totalUsers,
    newUsersThisMonth,
    newUsersLastMonth,
    activeSubscribers,
    totalRevenue,
    monthlyRevenue,
    lastMonthRevenue,
    totalTransactions,
    activePlans,
    revenueGrowth: lastMonthRevenue > 0
      ? parseFloat(((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(1))
      : 0,
    userGrowth: newUsersLastMonth > 0
      ? parseFloat(((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth * 100).toFixed(1))
      : 0,
  };
};

// ======================================
// Revenue Report: Monthly Breakdown (12 months)
// ======================================

const getRevenueReport = async (year) => {
  const targetYear = year || new Date().getFullYear();
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  const revenueByMonth = await Payment.aggregate([
    {
      $match: {
        status: "success",
        paidAt: {
          $gte: new Date(targetYear, 0, 1),
          $lte: new Date(targetYear, 11, 31, 23, 59, 59),
        },
      },
    },
    {
      $group: {
        _id: { month: { $month: "$paidAt" }, plan: "$plan" },
        revenue: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
    { $sort: { "_id.month": 1 } },
  ]);

  // Build 12-month structure
  const monthlyData = MONTHS.map((name, i) => {
    const monthNum = i + 1;
    const entries = revenueByMonth.filter(r => r._id.month === monthNum);
    const total = entries.reduce((s, e) => s + e.revenue, 0);
    const payments = entries.reduce((s, e) => s + e.count, 0);
    return { name, month: monthNum, total, payments };
  });

  // Revenue by plan (pie chart)
  const revenueByPlan = await Payment.aggregate([
    { $match: { status: "success" } },
    {
      $group: {
        _id: "$plan",
        revenue: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
    { $sort: { revenue: -1 } },
  ]);

  return { year: targetYear, monthlyData, revenueByPlan };
};

// ======================================
// User Report: Growth + Plan Distribution
// ======================================

const getUserReport = async () => {
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const now = new Date();
  const year = now.getFullYear();

  // Monthly user growth for current year
  const userGrowth = await User.aggregate([
    {
      $match: {
        createdAt: {
          $gte: new Date(year, 0, 1),
          $lte: new Date(year, 11, 31, 23, 59, 59),
        },
      },
    },
    {
      $group: {
        _id: { month: { $month: "$createdAt" } },
        signups: { $sum: 1 },
      },
    },
    { $sort: { "_id.month": 1 } },
  ]);

  const monthlyGrowth = MONTHS.map((name, i) => {
    const found = userGrowth.find(u => u._id.month === i + 1);
    return { name, signups: found?.signups || 0 };
  });

  // Plan distribution
  const planDistribution = await User.aggregate([
    {
      $group: {
        _id: "$subscription.plan",
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
  ]);

  // Account status distribution
  const statusDistribution = await User.aggregate([
    {
      $group: {
        _id: "$accountStatus",
        count: { $sum: 1 },
      },
    },
  ]);

  // Verified vs unverified
  const verified = await User.countDocuments({ isVerified: true });
  const unverified = await User.countDocuments({ isVerified: false });

  return {
    year,
    monthlyGrowth,
    planDistribution,
    statusDistribution,
    verificationStats: { verified, unverified },
  };
};

// ======================================
// Subscription Report: Churn + Activations + History
// ======================================

const getSubscriptionReport = async () => {
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const now = new Date();
  const year = now.getFullYear();

  // Monthly activations + churn for current year
  const activations = await SubscriptionHistory.aggregate([
    {
      $match: {
        action: "activated",
        createdAt: {
          $gte: new Date(year, 0, 1),
          $lte: new Date(year, 11, 31, 23, 59, 59),
        },
      },
    },
    {
      $group: {
        _id: { month: { $month: "$createdAt" } },
        count: { $sum: 1 },
      },
    },
  ]);

  const churnEvents = await SubscriptionHistory.aggregate([
    {
      $match: {
        action: { $in: ["cancelled", "expired"] },
        createdAt: {
          $gte: new Date(year, 0, 1),
          $lte: new Date(year, 11, 31, 23, 59, 59),
        },
      },
    },
    {
      $group: {
        _id: { month: { $month: "$createdAt" } },
        count: { $sum: 1 },
      },
    },
  ]);

  const monthlySubscriptionTrend = MONTHS.map((name, i) => {
    const monthNum = i + 1;
    const activated = activations.find(a => a._id.month === monthNum)?.count || 0;
    const churned = churnEvents.find(c => c._id.month === monthNum)?.count || 0;
    return { name, Activated: activated, Churned: churned };
  });

  // Action breakdown totals
  const actionBreakdown = await SubscriptionHistory.aggregate([
    { $group: { _id: "$action", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  // Recent subscription history (last 20 events)
  const recentHistory = await SubscriptionHistory.find()
    .sort({ createdAt: -1 })
    .limit(20)
    .populate("userId", "fullName email")
    .lean();

  return {
    year,
    monthlySubscriptionTrend,
    actionBreakdown,
    recentHistory: recentHistory.map(h => ({
      _id: h._id,
      user: h.userId?.fullName || "Unknown",
      email: h.userId?.email || "",
      action: h.action,
      amount: h.amount || 0,
      provider: h.provider || "—",
      note: h.note || "",
      createdAt: h.createdAt,
    })),
  };
};

// ======================================
// Payment Report: Payments Table + Stats
// ======================================

const getPaymentReport = async ({ page = 1, limit = 15, status, startDate, endDate } = {}) => {
  const filter = {};
  if (status) filter.status = status;
  if (startDate || endDate) {
    filter.paidAt = {};
    if (startDate) filter.paidAt.$gte = new Date(startDate);
    if (endDate) filter.paidAt.$lte = new Date(endDate);
  }

  const payments = await Payment.find(filter)
    .sort({ paidAt: -1, createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .populate("userId", "fullName email")
    .lean();

  const total = await Payment.countDocuments(filter);

  // Stats
  const statsAgg = await Payment.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        total: { $sum: "$amount" },
      },
    },
  ]);

  const stats = { success: { count: 0, total: 0 }, pending: { count: 0, total: 0 }, failed: { count: 0, total: 0 } };
  statsAgg.forEach(s => {
    if (stats[s._id]) stats[s._id] = { count: s.count, total: s.total };
  });

  return {
    payments: payments.map(p => ({
      _id: p._id,
      user: p.userId?.fullName || "Unknown",
      email: p.userId?.email || "",
      amount: p.amount,
      currency: p.currency,
      plan: p.plan,
      provider: p.provider,
      status: p.status,
      paidAt: p.paidAt || p.createdAt,
    })),
    total,
    page: Number(page),
    totalPages: Math.ceil(total / limit),
    stats,
  };
};

module.exports = {
  getReportSummary,
  getRevenueReport,
  getUserReport,
  getSubscriptionReport,
  getPaymentReport,
};
