const {
  insertIntoPayment,
  getPaymentByApplicationId,
  updatePaymentsStatus,
  listAllPayments,
} = require("../models/paymentModel");
const { createRazorpayInstance } = require("../config/paymentConfig");
const crypto = require("crypto");
const pool = require("../config/db");

// Create a new Razorpay order
const createPaymentOrder = async (req, res) => {
  try {
    const { payment_type, student_id, application_id, course } = req.body;

    // Validate input
    if (!payment_type || !course) {
      return res
        .status(400)
        .json({ error: "Payment type and course are required." });
    }

    if (!student_id && !application_id) {
      return res.status(400).json({
        error: "Either student_id or application_id must be provided.",
      });
    }

    // Fetch amount from the fee_pricing table
    const feeQuery =
      "SELECT amount FROM fee_pricing WHERE payment_type = $1 AND course = $2";
    const feeResult = await pool.query(feeQuery, [payment_type, course]);

    if (feeResult.rows.length === 0) {
      return res.status(400).json({
        error: "Invalid payment type or course. No fee found.",
      });
    }

    const amount = feeResult.rows[0].amount;

    // Create Razorpay order
    const razorpayInstance = createRazorpayInstance();
    const options = {
      amount: parseFloat(amount) * 100, // Convert to paise
      currency: "INR",
      receipt: `receipt_order_${Date.now()}`,
      payment_capture: 1,
      notes: {
        ...(student_id && { student_id }),
        ...(application_id && { application_id }),
        payment_type,
      },
    };

    const order = await razorpayInstance.orders.create(options);
    console.log("Razorpay Order Created");

    res.status(201).json({
      message: "Razorpay order created successfully.",
      order,
      amount,
    });
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    res.status(500).json({
      error:
        "Something went wrong while creating the Razorpay order. Please try again later.",
    });
  }
};

// Verify and insert payment manually
const verifyAndInsertPayment = async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_order_id } = req.body;

    if (!razorpay_payment_id || !razorpay_order_id) {
      return res.status(400).json({ error: "Payment ID and Order ID are required." });
    }

    const razorpayInstance = createRazorpayInstance();

    // Fetch payment details from Razorpay
    const paymentDetails = await razorpayInstance.payments.fetch(razorpay_payment_id);

    if (paymentDetails.order_id !== razorpay_order_id) {
      return res.status(400).json({ error: "Order ID mismatch." });
    }

    if (paymentDetails.status !== "captured") {
      return res.status(400).json({ error: "Payment is not captured." });
    }

    // Prepare payment data for insertion
    const {
      id: transaction_id,
      order_id,
      amount,
      method: payment_method,
      notes,
    } = paymentDetails;

    if (!notes || (!notes.student_id && !notes.application_id)) {
      return res.status(400).json({
        error: "Either 'student_id' or 'application_id' must be present in notes.",
      });
    }

    const paymentData = {
      razorpay_order_id: order_id,
      student_id: notes.student_id,
      application_id: notes.application_id,
      amount: amount / 100,
      payment_method,
      payment_status: "Paid",
      transaction_id,
      payment_type: notes.payment_type,
      notes,
    };

    // Insert into the database
    await insertIntoPayment(paymentData);
    console.log('payment verification and insertion into DB successful');
    res.status(200).json({
      message: "Payment verified and saved successfully.",
      paymentData,
    });
  } catch (error) {
    console.error("Error verifying and inserting payment:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


// List all payments
const listPayments = async (req, res) => {
  try {
    const payments = await listAllPayments();
    res.status(200).json(payments);
  } catch (error) {
    console.error("Error listing payments:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Retrieve payment details
const getPayments = async (req, res) => {
  try {
    const { application_id } = req.params;

    if (!application_id) {
      return res.status(400).json({ error: "Application ID is required" });
    }

    const payment = await getPaymentByApplicationId(application_id);

    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }

    res.status(200).json(payment);
  } catch (error) {
    console.error("Error retrieving payment:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Update payment status
const updatePaymentStatus = async (req, res) => {
  try {
    const { student_id, application_id, payment_status } = req.body;

    if (!payment_status) {
      return res.status(400).json({ error: "Payment status is required" });
    }

    const updatedPayment = await updatePaymentsStatus(
      student_id || application_id,
      payment_status
    );

    if (!updatedPayment) {
      return res.status(404).json({ error: "Payment not found" });
    }

    res
      .status(200)
      .json({ message: "Payment status updated", updatedPayment });
  } catch (error) {
    console.error("Error updating payment status:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  createPaymentOrder,
  verifyAndInsertPayment,
  listPayments,
  getPayments,
  updatePaymentStatus,
};
