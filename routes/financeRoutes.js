const express = require("express");
const {razorpayReceipt, allPaymentReceiptsByDate, getFeePpricing, feePricing, allPaymentReceipts} = require("../controller/financeController");
const { authenticateUser, authorizeRoles } = require("../middleware/basicAuth");


const router = express.Router();

router.get("/receipts/:transaction_id",authenticateUser, authorizeRoles('admin'), razorpayReceipt);

router.get("/receipt",authenticateUser, authorizeRoles('admin'), allPaymentReceiptsByDate);

router.get("/allreceipts",authenticateUser, authorizeRoles('admin'), allPaymentReceipts);

router.put("/feepricing",authenticateUser, authorizeRoles('admin'), feePricing);

router.get("/feepricing", getFeePpricing);

module.exports = router;