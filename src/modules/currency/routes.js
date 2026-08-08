const express = require("express");
const router = express.Router();

const currencyController = require("./controller");
const { getExchangeRatesForFrontend } = require("./controller");

router.get("/", currencyController.getRates);
router.get("/rates", currencyController.getExchangeRatesForFrontend);
router.get("/update", currencyController.updateRates);
router.post("/convert", currencyController.convertCurrency);

module.exports = router;