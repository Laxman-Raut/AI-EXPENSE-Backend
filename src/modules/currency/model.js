const mongoose = require("mongoose");

const currencySchema = new mongoose.Schema(
  {
    baseCurrency: {
      type: String,
      default: "INR",
    },

    rates: {
      type: Object,
      required: true,
    },

    fetchedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("CurrencyRate", currencySchema);