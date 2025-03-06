const express = require("express");
const {  createPaymentOrder,verifyAndInsertPayment,listPayments,getPayments,updatePaymentStatus } = require('../controller/paymentController');
const { fetchFeeDetails } = require("../controller/fetchFeesDetailsController");
const { authenticateUser, authorizeRoles } = require('../middleware/basicAuth');



const router = express.Router();

/* ************************* PAYMENTS SECTION *************************** */

// Create a new payment
router.post("/createPayment", createPaymentOrder);

// Get payment details by ID
router.get("/getPayment/:application_id", getPayments);

// Update payment status
router.put("/updatePayment/:id/status", updatePaymentStatus);


// List all payments
router.get("/listAllPayments", listPayments);

// Frontend verification route
router.post('/verifyPayment', 
    verifyAndInsertPayment
  );

// Verify and save payment


// Fetch fee details
router.get("/fetchFeeDetails", fetchFeeDetails);

module.exports = router;