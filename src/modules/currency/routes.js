const express = require("express");
const router = express.Router();

const currencyController = require("./controller");

router.get("/", currencyController.getRates);
router.get("/update", currencyController.updateRates);
router.post("/convert", currencyController.convertCurrency);

module.exports = router;