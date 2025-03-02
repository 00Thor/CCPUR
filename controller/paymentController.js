  const { insertIntoPayment, /*getPaymentByOrderId,*/ updatePaymentsStatus, listAllPayments} = require("../models/paymentModel");
  const { createRazorpayInstance } = require("../config/paymentConfig");
  const crypto = require('crypto');
  const pool = require("../config/db");

  const createPaymentOrder = async (req, res) => {
    try {
      const { payment_type, student_id, application_id, stream } = req.body;
  
      // Validate input
      if (!payment_type || !stream) {
        return res.status(400).json({ error: "Payment type & stream are required" });
      }
  
      if (!student_id && !application_id) {
        return res.status(400).json({ error: "Either student_id or application_id must be provided" });
      }
  
      // Fetch amount from the fee_pricing table
      const feeQuery = "SELECT amount FROM fee_pricing WHERE payment_type = $1 AND stream = $2";
      const feeResult = await pool.query(feeQuery, [payment_type, stream]);
  
      if (feeResult.rows.length === 0) {
        return res.status(400).json({ error: "Invalid payment type or stream" });
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
          student_id: student_id || null,
          application_id: application_id || null,
          payment_type,
        },
      };
  
      const order = await razorpayInstance.orders.create(options);
  
      res.status(201).json({
        message: "Razorpay order created successfully",
        order,
        amount,
      });
    } catch (error) {
      console.error("Error creating Razorpay order:", error.message);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };
  

  // // Get a payment by ID
  // const getPaymentByOrderId = async (req, res) => {
  //   try {
  //     const { id } = req.params;
  //     const payment = await getPaymentByOrderId(id);

  //     if (!payment) {
  //       return res.status(404).json({ error: "Payment not found" });
  //     }

  //     res.status(200).json(payment);
  //   } catch (error) {
  //     console.error("Error retrieving payment:", error);
  //     res.status(500).json({ error: "Internal Server Error" });
  //   }
  // };

  // Update payment status
  const updatePaymentStatus = async (req, res) => {
    try {
      const { student_id, application_id, payment_status } = req.body;

      if (!payment_status) {
        return res.status(400).json({ error: "Payment status is required" });
      }

      const updatedPayment = await updatePaymentsStatus(id, payment_status);

      if (!updatedPayment) {
        return res.status(404).json({ error: "Payment not found" });
      }

      res.status(200).json({ message: "Payment status updated", updatedPayment });
    } catch (error) {
      console.error("Error updating payment status:", error);
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

  // verify payment on frontend

  const verifyPaymentFrontend = async (req, res) => {
    try {
      const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;
  
      if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
        return res.status(400).json({ success: false, message: "Incomplete payment details" });
      }
      console.log('Received Razorpay values:', {
        razorpay_payment_id,
        razorpay_order_id,
        razorpay_signature
      });
      
      // Validate Razorpay signature
      const body = `${razorpay_order_id}|${razorpay_payment_id}`;
      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(body)
        .digest("hex");
  
      if (expectedSignature !== razorpay_signature) {
        return res.status(400).json({ success: false, message: "Invalid signature" });
      }

      return res.status(200).json({
        success: true,
        message: "Payment verified successfully",
        payment_id: razorpay_payment_id,
        order_id: razorpay_order_id,
      });
    } catch (error) {
      console.error("Error verifying payment:", error.message);
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  };

// Webhook handler to verify and save payment details

const verifyAndSavePayment = async (req, res) => {
  try {
    // Razorpay signature from the headers
    const razorpaySignature = req.headers["x-razorpay-signature"];

    // Values from the webhook
    const razorpay_order_id = req.body.razorpay_order_id;
    const razorpay_payment_id = req.body.razorpay_payment_id;
    const razorpay_signature = req.body.razorpay_signature;

    // Log the received values
    console.log('Received Razorpay Values:');
    console.log('razorpay_order_id:', razorpay_order_id);
    console.log('razorpay_payment_id:', razorpay_payment_id);
    console.log('razorpay_signature:', razorpay_signature); console.log('Received Razorpay Values:');
    console.log('razorpay_order_id:', razorpay_order_id);
    console.log('razorpay_payment_id:', razorpay_payment_id);
    console.log('razorpay_signature:', razorpay_signature);

    // Prepare the data to generate the expected signature (usually the concatenation of order_id and payment_id)
    const data = razorpay_order_id + "|" + razorpay_payment_id;

    // Generate the expected signature using HMAC with SHA256
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(data)
      .digest("hex");

    // Log the expected signature
    console.log('Expected Signature:', expectedSignature);

    // Compare the Razorpay signature with the expected signature
    if (razorpaySignature !== expectedSignature) {
      console.error("Invalid Razorpay signature");
      return res.status(400).send("Invalid signature");
    }
  
      const { event, payload } = req.body;
  
      console.log(`Received Razorpay event: ${event}`);
  
      switch (event) {
        case "payment.captured":
          await handlePaymentCaptured(payload.payment);
          break;
  
        case "payment.failed":
          await handlePaymentFailed(payload.payment);
          break;
  
        default:
          console.warn(`Unhandled Razorpay event: ${event}`);
          return res.status(200).send("Event ignored");
      }
  
      res.status(200).send("Webhook processed successfully");
    } catch (error) {
      console.error("Error processing Razorpay webhook:", error.message);
      res.status(500).send("Internal Server Error");
    }
  };
  
  const handlePaymentCaptured = async (payment) => {
    try {
      const {
        id: transaction_id,
        order_id: razorpay_order_id,
        amount,
        method: payment_method,
        notes,
      } = payment;
  
      const { student_id, application_id, payment_type } = notes || {};
  
      if (!student_id && !application_id) {
        throw new Error("Either 'student_id' or 'application_id' must be present in notes.");
      }
  
      const paymentData = {
        razorpay_order_id,
        student_id,
        application_id,
        amount: amount / 100,
        payment_method,
        payment_status: "Success",
        transaction_id,
        payment_type,
        notes,
      };
  
      await insertIntoPayment(paymentData);
      console.log("Payment captured and saved successfully");
    } catch (error) {
      console.error("Error handling payment.captured event:", error.message);
      throw error;
    }
  };
  

  module.exports = {
    createPaymentOrder,
    updatePaymentStatus,
    listPayments,
    verifyAndSavePayment,
    verifyPaymentFrontend
  };
