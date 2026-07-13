const express = require("express");
const { exportTransactions, authenticateQuery } = require("./controller");

const router = express.Router();


router.get("/", authenticateQuery, exportTransactions);

module.exports = router;
