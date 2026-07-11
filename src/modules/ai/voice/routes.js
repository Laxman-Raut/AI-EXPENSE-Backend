const express = require("express");
const { voiceTransactionController } = require("./controller");

const router = express.Router();

router.post("/transaction", voiceTransactionController);

module.exports = router;