const express = require("express");
const router = express.Router();
const { verifyAndSavePayment } = require("../controller/paymentController");

// Webhook route to handle Razorpay events
router.post("/razorpay/webhook", express.raw({ type: "application/json" }), verifyAndSavePayment);

module.exports = router;
