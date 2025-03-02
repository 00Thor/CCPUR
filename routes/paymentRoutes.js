const express = require("express");
const { createPaymentOrder, /*getPaymentByUserId,*/ updatePaymentStatus, listPayments, verifyPaymentFrontend } = require('../controller/paymentController');
const { fetchFeeDetails } = require("../controller/fetchFeesDetailsController");
const { authenticateUser, authorizeRoles } = require('../middleware/basicAuth');



const router = express.Router();

/* ************************* PAYMENTS SECTION *************************** */

// Create a new payment
router.post("/createPayment", createPaymentOrder);

// Get payment details by ID
//router.get("/getPayment/:id", getPaymentByUserId);

// Update payment status
router.patch("/updatePayment/:id/status", updatePaymentStatus);

// List all payments
router.get("/listAllPayments", listPayments);

// Frontend verification route
router.post('/verifyFrontEndPayment', (req, res) => {
    console.log('Received request for verifyFrontEndPayment');
    verifyPaymentFrontend(req, res);
  });

// Fetch fee details
router.get("/fetchFeeDetails", fetchFeeDetails);

module.exports = router;