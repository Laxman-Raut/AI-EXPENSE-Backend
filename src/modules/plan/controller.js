const {
  createPlanService,
  getAllPlansService,
  getPublicPlansService,
  getPlanByIdService,
  getPlanHistoryService,
  createPlanVersionService,
  updatePlanService,
  updateDraftPlanService,
  deletePlanService,
} = require("./service");

// Create Plan
const createPlan = async (req, res) => {
  try {
    const plan = await createPlanService(req.body, req.user.userId || req.user.id);

    res.status(201).json({
      success: true,
      message: "Plan created successfully.",
      data: plan,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Get All Plans (Admin)
const getAllPlans = async (req, res) => {
  try {
    const plans = await getAllPlansService();

    res.status(200).json({
      success: true,
      data: plans,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get Public Plans (Mobile App)
const getPublicPlans = async (req, res) => {
  try {
    const plans = await getPublicPlansService();
    const { getRatesMap, convertAmountWithRates, getUsdInrExchangeRate } = require("../currency/service");
    const ratesMap = await getRatesMap();
    const liveExchangeRate = getUsdInrExchangeRate(ratesMap);

    // Target user currency: authenticated user's currency || query parameter || 'INR'
    const targetCurrency = String(
      (req.user && req.user.currency) || req.query?.currency || "INR"
    ).toUpperCase().trim();

    const formattedPlans = plans.map(p => {
      const planObj = p.toObject ? p.toObject() : { ...p };
      const basePrice = planObj.price;
      const baseCurrency = String(planObj.currency || "INR").toUpperCase().trim();

      const displayPrice = convertAmountWithRates(basePrice, baseCurrency, targetCurrency, ratesMap);
      const priceInINR = convertAmountWithRates(basePrice, baseCurrency, "INR", ratesMap);

      return {
        ...planObj,
        basePrice,
        baseCurrency,
        displayPrice,
        displayCurrency: targetCurrency,
        exchangeRate: liveExchangeRate,
        priceInINR,
        // Set price & currency for backwards compatibility with existing mobile UI components
        price: displayPrice,
        currency: targetCurrency,
      };
    });

    res.status(200).json({
      success: true,
      data: formattedPlans,
      exchangeRate: liveExchangeRate,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get Plan By ID
const getPlanById = async (req, res) => {
  try {
    const plan = await getPlanByIdService(req.params.id);

    res.status(200).json({
      success: true,
      data: plan,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

// Get Plan History
const getPlanHistory = async (req, res) => {
  try {
    const plans = await getPlanHistoryService(req.params.slug);

    res.status(200).json({
      success: true,
      data: plans,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

// Create New Plan Version
const createPlanVersion = async (req, res) => {
  try {
    const plan = await createPlanVersionService(
      req.params.id,
      req.body,
      req.user.userId || req.user.id
    );

    res.status(200).json({
      success: true,
      message: "New plan version created successfully.",
      data: plan,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Update Plan (General Update for Price, Currency, Details)
const updatePlan = async (req, res) => {
  try {
    console.log("[Plan Update] Received body:", JSON.stringify({ price: req.body.price, currency: req.body.currency }));
    
    const plan = await updatePlanService(
      req.params.id,
      req.body,
      req.user.userId || req.user.id
    );

    console.log("[Plan Update] Saved to DB:", JSON.stringify({ price: plan.price, currency: plan.currency }));

    res.status(200).json({
      success: true,
      message: "Plan updated successfully.",
      data: plan,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Update Draft Plan
const updateDraftPlan = async (req, res) => {
  return updatePlan(req, res);
};

// Delete Plan
const removePlan = async (req, res) => {
  try {
    const result = await deletePlanService(req.params.id);

    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createPlan,
  getAllPlans,
  getPublicPlans,
  getPlanById,
  getPlanHistory,
  createPlanVersion,
  updatePlan,
  updateDraftPlan,
  removePlan,
};