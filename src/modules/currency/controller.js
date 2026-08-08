const currencyService = require("./service");

// Update exchange rates manually
const updateRates = async (req, res) => {
  try {
    const result = await currencyService.fetchLatestRates();

    return res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// Get stored exchange rates
const getRates = async (req, res) => {
  try {
    const result = await currencyService.getRates();

    return res.status(result.success ? 200 : 404).json(result);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
const convertCurrency = async (req, res) => {
  try {
    const { amount, from, to } = req.body;

    if (!amount || !from || !to) {
      return res.status(400).json({
        success: false,
        message: "Amount, from and to currency are required.",
      });
    }

    const result = await currencyService.convertCurrency(
      Number(amount),
      from.toUpperCase(),
      to.toUpperCase()
    );

    return res.status(result.statusCode).json(result);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const getExchangeRatesForFrontend = async (req, res) => {
  try {
    const result = await currencyService.getExchangeRateForFrontend();
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

module.exports = {
  updateRates,
  getRates,
   convertCurrency,
  getExchangeRatesForFrontend,
};