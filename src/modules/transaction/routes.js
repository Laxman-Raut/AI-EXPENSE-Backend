const express = require("express");

const {
  addTransaction,
  getAllTransactions,
  getTransaction,
  editTransaction,
  removeTransaction,
  syncBulkTransactions,
} = require("./controller");

const { validateTransaction } = require("./validation");
const authenticate = require("../auth/auth.middleware");

const router = express.Router();

router.post(
  "/sync",
  authenticate,
  syncBulkTransactions
);

router.post(
  "/",
  authenticate,
  validateTransaction,
  addTransaction
);

router.get(
  "/",
  authenticate,
  getAllTransactions
);

router.get(
    "/:id"
    , authenticate,
     getTransaction);


     router.put(
  "/:id",
  authenticate,
  validateTransaction,
  editTransaction
);

router.delete
("/:id",
     authenticate, 
     removeTransaction
    );
  
module.exports = router;