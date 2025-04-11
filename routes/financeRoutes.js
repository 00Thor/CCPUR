const express = require("express");
const {razorpayReceipt, allPaymentReceiptsByDate, getFeePpricing, feePricing} = require("../controller/financeController");


const router = express.Router();

router.get("/receipts/:transaction_id", razorpayReceipt);

router.get("/receipt", allPaymentReceiptsByDate);

router.put("/feepricing", feePricing);

router.get("/feepricing", getFeePpricing);

module.exports = router;