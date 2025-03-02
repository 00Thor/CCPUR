const pool = require("../config/db");

/**
 * Get a payment record by Razorpay order ID.
 * @param {string} razorpay_order_id - The Razorpay order ID.
 * @returns {Promise<Object|null>} The payment record, or null if not found.
 */

// Insert a new payment record in the database(on success)
  const insertIntoPayment = async (paymentData) => {
  if (!paymentData.student_id && !paymentData.application_id) {
    throw new Error("Either student_id or application_id must be provided.");
  }

  const query = `
    INSERT INTO payments (
      student_id, application_id, amount, payment_method, payment_status, 
      transaction_id, payment_type
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *;
  `;
  const values = [
    paymentData.student_id || null, // Use null if student_id is not provided
    paymentData.application_id || null, // Use null if application_id is not provided
    paymentData.amount,
    paymentData.payment_method,
    paymentData.payment_status || "Pending",
    paymentData.transaction_id,
    paymentData.payment_type,
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
};

const getPaymentByOrderId = async (razorpay_order_id) => {
  try {
    const query = "SELECT * FROM payments WHERE razorpay_order_id = $1";
    const result = await pool.query(query, [razorpay_order_id]);
    return result.rows[0] || null;
  } catch (error) {
    console.error("Error fetching payment by order ID:", error.message);
    throw error;
  }
};

// Update payment status
const updatePaymentsStatus = async (paymentId, status, transactionId) => {
  const query = `
   UPDATE payments
SET 
    payment_status = $1,
    transaction_id = $2,
    payment_m = 'offline',
    updated_at = CURRENT_TIMESTAMP
WHERE 
    applicant_id = $3 OR student_id = $3
RETURNING *;
  `;
  const result = await pool.query(query, [status, transactionId, paymentId]);
  return result.rows[0];
};

// List all payments
const listAllPayments = async () => {
  const query = "SELECT * FROM payments ORDER BY created_at DESC;";
  const result = await pool.query(query);
  return result.rows;
};

module.exports = {
  insertIntoPayment,
  getPaymentByOrderId,
  updatePaymentsStatus,
  listAllPayments,
};