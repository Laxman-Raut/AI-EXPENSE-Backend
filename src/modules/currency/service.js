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

module.exports = {
  fetchLatestRates,
  getRates,
  convertCurrency,
};