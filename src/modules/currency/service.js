const axios = require("axios");
const CurrencyRate = require("./model");
const fetchLatestRates = async () => {
  try {
    const response = await axios.get(
      `https://v6.exchangerate-api.com/v6/${process.env.EXCHANGE_RATE_API_KEY}/latest/${process.env.EXCHANGE_RATE_BASE}`
    );

    if (response.data.result !== "success") {
      throw new Error("Failed to fetch exchange rates");
    }

    const { conversion_rates, base_code } = response.data;

    let currency = await CurrencyRate.findOne();

    if (!currency) {
      currency = await CurrencyRate.create({
        baseCurrency: base_code,
        rates: conversion_rates,
        fetchedAt: new Date(),
      });
    } else {
      currency.baseCurrency = base_code;
      currency.rates = conversion_rates;
      currency.fetchedAt = new Date();

      await currency.save();
    }

    return {
      success: true,
      message: "Exchange rates updated successfully.",
      data: currency,
    };
  } catch (error) {
    console.error("Currency API Error:", error.response?.data || error.message);

    return {
      success: false,
      message: "Failed to update exchange rates.",
    };
  }
};

// Get stored exchange rates
const getRates = async () => {
  try {
    const currency = await CurrencyRate.findOne();

    if (!currency) {
      return {
        success: false,
        message: "Exchange rates not found.",
      };
    }

    return {
      success: true,
      data: currency,
    };
  } catch (error) {
    console.error(error);

    return {
      success: false,
      message: "Internal Server Error",
    };
  }
};
const convertCurrency = async (amount, from, to) => {
  try {
    const currency = await CurrencyRate.findOne();

    if (!currency) {
      return {
        success: false,
        statusCode: 404,
        message: "Exchange rates not found.",
      };
    }

    const rates = currency.rates;

    if (!rates[from] || !rates[to]) {
      return {
        success: false,
        statusCode: 400,
        message: "Unsupported currency.",
      };
    }

    // Convert to INR first
    let amountInINR;

    if (from === "INR") {
      amountInINR = amount;
    } else {
      amountInINR = amount / rates[from];
    }

    // Convert INR to target currency
    let convertedAmount;

    if (to === "INR") {
      convertedAmount = amountInINR;
    } else {
      convertedAmount = amountInINR * rates[to];
    }

    return {
      success: true,
      statusCode: 200,
      data: {
        amount,
        from,
        to,
        convertedAmount: Number(convertedAmount.toFixed(2)),
        rate: rates[to],
      },
    };
  } catch (error) {
    console.error(error);

    return {
      success: false,
      statusCode: 500,
      message: "Internal Server Error",
    };
  }
};

/**
 * Fast in-memory / single DB query helper to get rates map
 */
const getRatesMap = async () => {
  try {
    const currencyDoc = await CurrencyRate.findOne().lean();
    return currencyDoc?.rates || null;
  } catch (err) {
    console.error("Error fetching rates map:", err);
    return null;
  }
};

/**
 * Pure calculation helper to convert amount using rates map
 */
const convertAmountWithRates = (amount, from = "INR", to = "INR", rates = null) => {
  const num = Number(amount || 0);
  if (!num || from === to) return Number(num.toFixed(2));

  // Fallback rates if DB rates not fetched yet
  const r = rates || { USD: 1, INR: 86.5, EUR: 0.92 };
  const fromRate = r[from] || (from === "INR" ? 86.5 : 1);
  const toRate = r[to] || (to === "INR" ? 86.5 : 1);

  const amountInUSD = from === "USD" ? num : num / fromRate;
  const converted = to === "USD" ? amountInUSD : amountInUSD * toRate;

  return Number(converted.toFixed(2));
};

module.exports = {
  fetchLatestRates,
  getRates,
  getRatesMap,
  convertCurrency,
  convertAmountWithRates,
};