const express = require("express");
const {  createPaymentOrder,verifyAndInsertPayment,listPayments,getPayments,updatePaymentStatus } = require('../controller/paymentController');
const { fetchFeeDetails } = require("../controller/fetchFeesDetailsController");
const { authenticateUser, authorizeRoles, authorizeSelfAccess } = require('../middleware/basicAuth');



const router = express.Router();

/* ************************* PAYMENTS SECTION *************************** */

// Create a new payment
router.post("/createPayment",authenticateUser, createPaymentOrder);

// Get payment details by ID
router.get("/getPayment/:application_id",authenticateUser, authorizeRoles('admin'), authorizeSelfAccess, getPayments);

// Update payment status
router.put("/updatePayment/:id/status",authenticateUser, authorizeRoles('admin'), updatePaymentStatus);


// List all payments
router.get("/listAllPayments",authenticateUser, authorizeRoles('admin'), listPayments);

// Frontend verification route
router.post('/verifyPayment', 
    verifyAndInsertPayment
  );

// Fetch fee details
router.get("/fetchFeeDetails", fetchFeeDetails);

module.exports = router;