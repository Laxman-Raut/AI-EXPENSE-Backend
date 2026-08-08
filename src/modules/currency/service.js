const axios = require("axios");
const CurrencyRate = require("./model");
const fetchLatestRates = async () => {
  try {
let response;
const apiKey = process.env.EXCHANGE_RATE_API_KEY;
const base = process.env.EXCHANGE_RATE_BASE || "USD";

// Use keyed endpoint if valid API key exists in .env, otherwise use official open free endpoint (no API key required)
const url = (apiKey && apiKey !== "invalid-key" && apiKey.trim())
  ? `https://v6.exchangerate-api.com/v6/${apiKey.trim()}/latest/${base}`
  : `https://open.er-api.com/v6/latest/${base}`;

    if (apiKey && apiKey !== "invalid-key" && apiKey.trim() !== "") {
      try {
        response = await axios.get(
          `https://v6.exchangerate-api.com/v6/${apiKey}/latest/${base}`
        );
      } catch (e) {
        console.warn("[Currency Rates] ⚠️ Primary API key failed, using open API fallback...");
      }
    }

if (!response || response.data?.result !== "success") {
  // Fallback to open exchange rate API (no key required)
  response = await axios.get(`https://open.er-api.com/v6/latest/${base}`);
}

    if (response.data && (response.data.result === "success" || response.data.rates)) {
      const conversion_rates = response.data.conversion_rates || response.data.rates;
      const base_code = response.data.base_code || response.data.base || base;

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

      console.log("[Currency Rates] ✅ Exchange rates loaded & updated successfully.");

      return {
        success: true,
        message: "Exchange rates updated successfully.",
        data: currency,
      };
    } else {
      throw new Error("Failed to fetch exchange rates from all sources.");
    }
  } catch (error) {
    console.error("Currency API Warning:", error.response?.data || error.message);

    // Fallback: If no currency rate document exists in DB, seed static fallback rates so app & dashboard operate smoothly
    try {
      let currency = await CurrencyRate.findOne();
      if (!currency) {
        const defaultRates = {
          USD: 1,
          INR: 85.0,
          EUR: 0.92,
          GBP: 0.79,
          AED: 3.67,
          CAD: 1.36,
          AUD: 1.52,
          JPY: 155.0,
        };
        await CurrencyRate.create({
          baseCurrency: "USD",
          rates: defaultRates,
          fetchedAt: new Date(),
        });
        console.log("⚠️ Applied fallback default exchange rates (1 USD = 85 INR).");
      }
    } catch (fallbackErr) {
      console.error("Failed to seed fallback exchange rates:", fallbackErr.message);
    }

    return {
      success: false,
      message: "Failed to update exchange rates. Using stored/fallback rates.",
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

const mongoose = require("mongoose");

/**
 * Fast in-memory / single DB query helper to get rates map
 */
const getRatesMap = async () => {
  try {
    if (mongoose.connection.readyState !== 1) return null;
    const currencyDoc = await CurrencyRate.findOne().lean();
    return currencyDoc?.rates || null;
  } catch (err) {
    console.error("Error fetching rates map:", err);
    return null;
  }
};

/**
 * Helper to round currency amounts based on currency rules
 */
const roundCurrency = (val, currency = "INR") => {
  const num = Number(val || 0);
  if (isNaN(num)) return 0;
  const curr = String(currency || "").toUpperCase().trim();
  if (curr === "USD" || curr === "EUR" || curr === "GBP") {
    return Number(num.toFixed(2));
  }
  return Number(num.toFixed(2));
};

/**
 * Returns latest USD/INR exchange rate (1 USD = X INR)
 */
const getUsdInrExchangeRate = (ratesMap = null) => {
  const r = (ratesMap && Object.keys(ratesMap).length > 0) ? ratesMap : { USD: 0.0111, INR: 1 };
  const usdRate = Number(r["USD"] || 0.0111);
  const inrRate = Number(r["INR"] || 1);
  if (usdRate <= 0) return 90.0;
  const rate = inrRate / usdRate;
  return Number(rate.toFixed(4));
};

const convertAmountWithRates = (amount, from = "INR", to = "INR", rates = null) => {
  const num = Number(amount || 0);
  if (!num) return 0;

  const normalize = (c) => {
    const s = String(c || "").toUpperCase().trim();
    if (s === "$" || s === "USD") return "USD";
    if (s === "INR") return "INR";
    return s;
  };

  const normFrom = normalize(from);
  const normTo = normalize(to);

  if (normFrom === normTo) return roundCurrency(num, normTo);

  // Use live market rates map from Currency API (fallback if rates doc missing)
  const r = (rates && Object.keys(rates).length > 0) ? rates : { USD: 0.0111, INR: 1 };
  
  let fromRate = Number(r[normFrom] || (normFrom === "USD" ? 0.0111 : 1));
  let toRate = Number(r[normTo] || (normTo === "USD" ? 0.0111 : 1));

  if (fromRate <= 0) fromRate = 1;
  if (toRate <= 0) toRate = 1;

  const amountInBase = num / fromRate;
  const converted = amountInBase * toRate;

  return roundCurrency(converted, normTo);
};

/**
 * Returns a clean exchange rates response for frontend consumption.
 * Used by Dashboard and Mobile App to get live rates instead of hardcoded values.
 */
const getExchangeRateForFrontend = async () => {
  try {
    const currencyDoc = await CurrencyRate.findOne().lean();
    if (!currencyDoc || !currencyDoc.rates) {
      return {
        baseCurrency: "USD",
        rates: { USD: 1, INR: 85.0, EUR: 0.92, GBP: 0.79 },
        usdToInr: 85.0,
        fetchedAt: new Date().toISOString(),
        source: "fallback",
      };
    }
    const usdRate = Number(currencyDoc.rates["USD"] || 1);
    const inrRate = Number(currencyDoc.rates["INR"] || 85);
    const usdToInr = usdRate > 0 ? Number((inrRate / usdRate).toFixed(4)) : 85.0;

    return {
      baseCurrency: currencyDoc.baseCurrency || "USD",
      rates: currencyDoc.rates,
      usdToInr,
      fetchedAt: currencyDoc.fetchedAt || currencyDoc.updatedAt,
      source: "live",
    };
  } catch (err) {
    console.error("[Currency] Failed to get rates for frontend:", err.message);
    return {
      baseCurrency: "USD",
      rates: { USD: 1, INR: 85.0 },
      usdToInr: 85.0,
      fetchedAt: new Date().toISOString(),
      source: "fallback",
    };
  }
};

module.exports = {
  fetchLatestRates,
  getRates,
  getRatesMap,
  convertCurrency,
  convertAmountWithRates,
  getUsdInrExchangeRate,
  roundCurrency,
  getExchangeRateForFrontend,
};