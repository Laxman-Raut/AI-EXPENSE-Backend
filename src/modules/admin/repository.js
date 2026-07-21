const User = require("../auth/model");
const Payment = require("../payment/model");
const Plan = require("../plan/model");
const SubscriptionHistory = require("../subscription-history/model");


// Users

const getTotalUsers = () => User.countDocuments();

const getVerifiedUsers = () =>
    User.countDocuments({
        isVerified: true,
    });

// ==============================
// Subscription
// ==============================

const getPremiumUsers = () =>
    User.countDocuments({
        "subscription.plan": "pro",
        "subscription.status": "active",
    });

const getFreeUsers = () =>
    User.countDocuments({
        "subscription.plan": "free",
    });

// ==============================
// Revenue
// ==============================

const getTotalRevenue = async () => {
    const result = await Payment.aggregate([
        {
            $match: {
                status: "success",
            },
        },
        {
            $group: {
                _id: null,
                total: {
                    $sum: "$amount",
                },
            },
        },
    ]);

    return result[0]?.total || 0;
};

// ==============================
// Plans
// ==============================

const getActivePlans = () =>
    Plan.countDocuments({
        status: "active",
        isCurrent: true,
    });

// ==============================
// Payments
// ==============================

const getPendingPayments = () =>
    Payment.countDocuments({
        status: "pending",
    });

// ======================================
// Revenue Today
// ======================================

const getTodayRevenue = async () => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const result = await Payment.aggregate([
        {
            $match: {
                status: "success",
                paidAt: {
                    $gte: start,
                    $lte: end,
                },
            },
        },
        {
            $group: {
                _id: null,
                total: {
                    $sum: "$amount",
                },
            },
        },
    ]);

    return result[0]?.total || 0;
};

// ======================================
// Monthly Revenue
// ======================================

const getMonthlyRevenue = async () => {
    const now = new Date();

    const start = new Date(
        now.getFullYear(),
        now.getMonth(),
        1
    );

    const end = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
        23,
        59,
        59
    );

    const result = await Payment.aggregate([
        {
            $match: {
                status: "success",
                paidAt: {
                    $gte: start,
                    $lte: end,
                },
            },
        },
        {
            $group: {
                _id: null,
                total: {
                    $sum: "$amount",
                },
            },
        },
    ]);

    return result[0]?.total || 0;
};

// ======================================
// New Users Today
// ======================================

const getTodayUsers = () => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    return User.countDocuments({
        createdAt: {
            $gte: start,
        },
    });
};

// ======================================
// New Users This Month
// ======================================

const getMonthlyUsers = () => {
    const now = new Date();

    const start = new Date(
        now.getFullYear(),
        now.getMonth(),
        1
    );

    return User.countDocuments({
        createdAt: {
            $gte: start,
        },
    });
};

// ======================================
// Latest Users
// ======================================

const getLatestUsers = () => {
    return User.find()
        .select("fullName email createdAt")
        .sort({
            createdAt: -1,
        })
        .limit(5);
};

// ======================================
// Latest Payments
// ======================================

const getLatestPayments = () => {
    return Payment.find()
        .populate("userId", "fullName email")
        .sort({
            createdAt: -1,
        })
        .limit(5);
};

// Revenue Trend (Last 7 Days)
// ======================================

const getRevenueTrend = async () => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 6);
    startDate.setHours(0, 0, 0, 0);

    return Payment.aggregate([
        {
            $match: {
                status: "success",
                paidAt: {
                    $gte: startDate,
                },
            },
        },
        {
            $group: {
                _id: {
                    $dateToString: {
                        format: "%Y-%m-%d",
                        date: "$paidAt",
                    },
                },
                revenue: {
                    $sum: "$amount",
                },
            },
        },
        {
            $sort: {
                _id: 1,
            },
        },
    ]);
};

// User Growth Trend (Last 7 Days)
// ======================================

const getUserGrowthTrend = async () => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 6);
    startDate.setHours(0, 0, 0, 0);

    return User.aggregate([
        {
            $match: {
                createdAt: {
                    $gte: startDate,
                },
            },
        },
        {
            $group: {
                _id: {
                    $dateToString: {
                        format: "%Y-%m-%d",
                        date: "$createdAt",
                    },
                },
                users: {
                    $sum: 1,
                },
            },
        },
        {
            $sort: {
                _id: 1,
            },
        },
    ]);
};

// Subscription Distribution
// ======================================

const getSubscriptionDistribution = async () => {
    return User.aggregate([
        {
            $group: {
                _id: "$subscription.plan",
                users: {
                    $sum: 1,
                },
            },
        },
        {
            $sort: {
                users: -1,
            },
        },
    ]);
};

// Revenue By Plan
// ======================================

const getRevenueByPlan = async () => {
  return Payment.aggregate([
    {
      $match: {
        status: "success",
      },
    },
    {
      $group: {
        _id: "$plan",
        revenue: {
          $sum: "$amount",
        },
        payments: {
          $sum: 1,
        },
      },
    },
    {
      $sort: {
        revenue: -1,
      },
    },
  ]);
};

// ======================================
// Get Users
// ======================================

const getUsers = async ({
  page = 1,
  limit = 10,
  search = "",
  plan,
  status,
  sort = "-createdAt",
}) => {
  const filter = {};

  // Search
  if (search) {
    filter.$or = [
      {
        fullName: {
          $regex: search,
          $options: "i",
        },
      },
      {
        email: {
          $regex: search,
          $options: "i",
        },
      },
    ];
  }

  // Subscription Plan
  if (plan) {
    filter["subscription.plan"] = plan;
  }

  // Subscription Status
  if (status) {
    filter["subscription.status"] = status;
  }

  const users = await User.find(filter)
    .select("-password -resetOtp -resetOtpExpiry")
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(Number(limit));

  const total = await User.countDocuments(filter);

  return {
    users,
    total,
    page: Number(page),
    totalPages: Math.ceil(total / limit),
  };
};

// ======================================
// Get User By Id
// ======================================

const getUserById = async (userId) => {
  const user = await User.findById(userId)
    .select("-password -resetOtp -resetOtpExpiry");

  if (!user) {
    throw new Error("User not found.");
  }

  const payments = await Payment.find({
    userId,
  })
    .sort({ createdAt: -1 })
    .limit(10);

  return {
    user,
    payments,
  };
};

// Get Plans
// ======================================

const getPlans = async () => {
  return Plan.find()
    .sort({
      displayOrder: 1,
      createdAt: -1,
    })
    .populate("createdBy", "fullName email")
    .populate("updatedBy", "fullName email");
};

// Create Plan
// ======================================

const createPlan = async (planData) => {
  const existingPlan = await Plan.findOne({
    slug: planData.slug,
    version: 1,
  });

  if (existingPlan) {
    throw new Error("Plan with this slug already exists.");
  }

  const plan = await Plan.create({
    ...planData,
    version: 1,
    isCurrent: true,
  });

  return plan;
};

// ======================================
// Update Plan (Versioning)
// ======================================

const updatePlan = async (planId, updateData, adminId) => {
  const currentPlan = await Plan.findById(planId);

  if (!currentPlan) {
    throw new Error("Plan not found.");
  }

  if (!currentPlan.isCurrent) {
    throw new Error("Only current plan can be updated.");
  }

  // Old version inactive
  currentPlan.isCurrent = false;
  await currentPlan.save();

  // Create new version
  const newPlan = await Plan.create({
    ...currentPlan.toObject(),

    _id: undefined,

    parentPlanId: currentPlan.parentPlanId || currentPlan._id,

    replacedBy: null,

    version: currentPlan.version + 1,

    isCurrent: true,

    effectiveFrom: new Date(),

    updatedBy: adminId,

    ...updateData,
  });

  // Link old → new
  currentPlan.replacedBy = newPlan._id;
  await currentPlan.save();

  return newPlan;
};


// ======================================
// Update Plan Status
// ======================================

const updatePlanStatus = async (
  planId,
  status,
  adminId
) => {
  const allowedStatus = [
    "draft",
    "active",
    "inactive",
  ];

  if (!allowedStatus.includes(status)) {
    throw new Error("Invalid plan status.");
  }

  const plan = await Plan.findById(planId);

  if (!plan) {
    throw new Error("Plan not found.");
  }

  plan.status = status;
  plan.updatedBy = adminId;

  await plan.save();

  return plan;
};

// ======================================
// Get Plan Details
// ======================================

const getPlanById = async (planId) => {
    const plan = await Plan.findById(planId)
        .populate("createdBy", "fullName email")
        .populate("updatedBy", "fullName email")
        .populate("parentPlanId", "name version price")
        .populate("replacedBy", "name version price");

    if (!plan) {
        throw new Error("Plan not found.");
    }

    const [
        totalSubscribers,
        activeSubscribers,
        totalRevenue,
        versions,
    ] = await Promise.all([

        User.countDocuments({
            "subscription.plan": plan.slug,
        }),

        User.countDocuments({
            "subscription.plan": plan.slug,
            "subscription.status": "active",
        }),

        Payment.aggregate([
            {
                $match: {
                    plan: plan.slug,
                    status: "success",
                },
            },
            {
                $group: {
                    _id: null,
                    revenue: {
                        $sum: "$amount",
                    },
                },
            },
        ]),

        Plan.find({
            $or: [
                {
                    parentPlanId:
                        plan.parentPlanId || plan._id,
                },
                {
                    _id:
                        plan.parentPlanId || plan._id,
                },
            ],
        }).sort({
            version: 1,
        }),
    ]);

    return {
        plan,

        analytics: {
            totalSubscribers,

            activeSubscribers,

            totalRevenue:
                totalRevenue[0]?.revenue || 0,
        },

        versions,
    };
};

// ======================================
// Get All Subscriptions
// ======================================

const getSubscriptions = async ({
    page = 1,
    limit = 10,
    status,
    plan,
    search,
}) => {

    const filter = {};

    if (status === "expiring_soon") {
        const now = new Date();
        const soon = new Date();
        soon.setDate(soon.getDate() + 3); // 3 days threshold
        filter["subscription.status"] = "active";
        filter["subscription.endDate"] = { $gte: now, $lte: soon };
    } else if (status) {
        filter["subscription.status"] = status;
    }

    if (plan) {
        filter["subscription.plan"] = plan;
    }

    if (search) {
        filter.$or = [
            {
                fullName: {
                    $regex: search,
                    $options: "i",
                },
            },
            {
                email: {
                    $regex: search,
                    $options: "i",
                },
            },
        ];
    }

    const subscriptions = await User.find(filter)
        .select(
            "fullName email avatar subscription createdAt"
        )
        .sort({
            "subscription.endDate": 1,
        })
        .skip((page - 1) * limit)
        .limit(Number(limit));

    const total = await User.countDocuments(filter);

    return {
        subscriptions,
        total,
        page: Number(page),
        totalPages: Math.ceil(total / limit),
    };
};

// ======================================
// Get Subscription Details
// ======================================

const getSubscriptionById = async (userId) => {
  const user = await User.findById(userId)
    .select("-password -resetOtp -resetOtpExpiry");

  if (!user) {
    throw new Error("User not found.");
  }

  const payments = await Payment.find({
    userId,
  }).sort({
    createdAt: -1,
  });

  const totalAmountPaid = payments.reduce(
    (sum, payment) =>
      payment.status === "success"
        ? sum + payment.amount
        : sum,
    0
  );

  const lastPayment =
    payments.length > 0 ? payments[0] : null;

  let currentPlan = null;

  if (user.subscription.plan !== "free") {
    currentPlan = await Plan.findOne({
      slug: user.subscription.plan,
      isCurrent: true,
    });
  }

  const now = new Date();

  const daysRemaining =
    user.subscription.endDate
      ? Math.max(
          0,
          Math.ceil(
            (user.subscription.endDate - now) /
              (1000 * 60 * 60 * 24)
          )
        )
      : 0;

  return {
    user,

    currentPlan,

    subscription: user.subscription,

    totalPayments: payments.length,

    totalAmountPaid,

    lastPayment,

    paymentHistory: payments,

    daysRemaining,
  };
};

// ======================================
// Activate Subscription
// ======================================

const activateSubscription = async (
    userId,
    planId,
    adminId
) => {

    const user = await User.findById(userId);

    if (!user) {
        throw new Error("User not found.");
    }

    const plan = await Plan.findById(planId);

    if (!plan) {
        throw new Error("Plan not found.");
    }

    if (plan.status !== "active") {
        throw new Error("Plan is inactive.");
    }

    const startDate = new Date();

    const endDate = new Date(startDate);

    endDate.setDate(
        endDate.getDate() + plan.durationDays
    );

    user.subscription = {
        plan: plan.slug,
        status: "active",
        provider: "manual",
        startDate,
        endDate,
        autoRenew: false,
    };

    await user.save();

    const payment = await Payment.create({
        userId: user._id,
        amount: 0,
        currency: plan.currency,
        plan: plan.slug === "pro" ? "pro_monthly" : plan.slug,
        provider: "manual",
        status: "success",
        paidAt: new Date(),
    });

    await SubscriptionHistory.create({
        userId: user._id,
        planId: plan._id,
        paymentId: payment._id,
        action: "activated",
        provider: "manual",
        startDate,
        endDate,
        amount: 0,
        currency: plan.currency,
        note: "Activated manually by admin.",
        createdBy: adminId,
    });

    return {
        user,
        payment,
    };
};

// ======================================
// Subscription Timeline
// ======================================

const getSubscriptionTimeline = async (
    userId
) => {

    return await SubscriptionHistory.find({
        userId,
    })
        .populate(
            "planId",
            "name version price"
        )
        .populate(
            "createdBy",
            "fullName email"
        )
        .sort({
            createdAt: -1,
        });

};

// ======================================
// Cancel Subscription
// ======================================

const cancelSubscription = async (
  userId,
  adminId
) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new Error("User not found.");
  }

  if (user.subscription.status !== "active") {
    throw new Error("Subscription is not active.");
  }

  const plan = await Plan.findOne({
    slug: user.subscription.plan,
    isCurrent: true,
  });

  user.subscription.status = "cancelled";
  user.subscription.autoRenew = false;
  user.subscription.endDate = new Date();

  await user.save();

  await SubscriptionHistory.create({
    userId: user._id,
    planId: plan?._id || null,
    action: "cancelled",
    provider: user.subscription.provider,
    startDate: user.subscription.startDate,
    endDate: user.subscription.endDate,
    amount: 0,
    currency: "INR",
    note: "Cancelled manually by admin.",
    createdBy: adminId,
  });

  return user.subscription;
};

// ======================================
// Extend Subscription
// ======================================

const extendSubscription = async (
  userId,
  durationDays,
  note,
  adminId
) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new Error("User not found.");
  }

  if (!durationDays || durationDays <= 0) {
    throw new Error("durationDays must be a positive number.");
  }

  let planSlug = user.subscription.plan;
  if (planSlug === "free" || !planSlug) {
    planSlug = "pro";
  }

  const plan = await Plan.findOne({
    slug: planSlug,
    isCurrent: true,
  }) || await Plan.findOne({ slug: planSlug });

  const now = new Date();
  let startDate = user.subscription.startDate || now;
  let currentEndDate = user.subscription.endDate;

  let newEndDate;
  if (user.subscription.status === "active" && currentEndDate && currentEndDate > now) {
    newEndDate = new Date(currentEndDate);
  } else {
    newEndDate = new Date(now);
    startDate = now;
  }
  newEndDate.setDate(newEndDate.getDate() + Number(durationDays));

  user.subscription = {
    plan: plan ? plan.slug : "pro",
    status: "active",
    provider: "manual",
    startDate,
    endDate: newEndDate,
    autoRenew: false,
  };

  await user.save();

  const payment = await Payment.create({
    userId: user._id,
    amount: 0,
    currency: plan ? plan.currency : "INR",
    plan: plan ? (plan.slug === "pro" ? "pro_monthly" : plan.slug) : "pro_monthly",
    provider: "manual",
    status: "success",
    paidAt: now,
  });

  await SubscriptionHistory.create({
    userId: user._id,
    planId: plan ? plan._id : null,
    paymentId: payment._id,
    action: "extended",
    provider: "manual",
    startDate,
    endDate: newEndDate,
    amount: 0,
    currency: plan ? plan.currency : "INR",
    note: note || `Extended by ${durationDays} days manually by admin.`,
    createdBy: adminId,
  });

  return user.subscription;
};

module.exports = {
    getTotalUsers,
    getVerifiedUsers,
    getPremiumUsers,
    getFreeUsers,
    getTotalRevenue,
    getTodayRevenue,
    getMonthlyRevenue,
    getTodayUsers,
    getMonthlyUsers,
    getLatestUsers,
    getLatestPayments,
    getActivePlans,
    getPendingPayments,
    getRevenueTrend,
    getUserGrowthTrend,
    getSubscriptionDistribution,
    getRevenueByPlan,
    getUsers,
     getUserById,
     getPlans,
      createPlan,
      updatePlan,
    updatePlanStatus,
    getPlanById,
    getSubscriptions,
    getSubscriptionById,
    activateSubscription,
    getSubscriptionTimeline,
    cancelSubscription,
    extendSubscription,
};