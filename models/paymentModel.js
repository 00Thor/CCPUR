const pool = require("../config/db");

/**
 * Get a payment record by Razorpay order ID.
 * @param {string} razorpay_order_id - The Razorpay order ID.
 * @returns {Promise<Object|null>} The payment record, or null if not found.
 */
//update and insert into payments either

const updatePayment = async (paymentData) => {
  if (!paymentData.student_id && !paymentData.application_id) {
    throw new Error("Either student_id or application_id must be provided.");
  }

  const query = `
  UPDATE payments
  SET 
    amount = COALESCE($1, amount),
    payment_date = COALESCE($2, payment_date),
    payment_status = COALESCE($3, payment_status),
    transaction_id = COALESCE($4, transaction_id),
    updated_at = CURRENT_TIMESTAMP,
    payment_type = COALESCE($5, payment_type),
    payment_method = COALESCE($6, payment_method),
    notes = COALESCE($7, notes),
    razorpay_order_id = COALESCE($8, razorpay_order_id)
  WHERE 
    (student_id = $9 OR application_id = $10)
  RETURNING *;
`;

const values = [
  paymentData.amount || null,
  paymentData.payment_date || new Date(),
  paymentData.payment_status || null,
  paymentData.transaction_id || null,
  paymentData.payment_type || null,
  paymentData.payment_method || null,
  paymentData.notes || null,
  paymentData.razorpay_order_id || null,
  paymentData.student_id || null,
  paymentData.application_id || null,
];

  const result = await pool.query(query, values);
  return result.rows[0];
};

// insert into payment if no entry yet
const insertPayment = async (paymentData) => {
  const query = `
    INSERT INTO payments (
      razorpay_order_id, student_id, application_id, amount, 
      payment_method, payment_status, transaction_id, 
      payment_type, notes, payment_date
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *;
  `;

  const values = [
    paymentData.razorpay_order_id,
    paymentData.student_id,
    paymentData.application_id,
    paymentData.amount,
    paymentData.payment_method,
    paymentData.payment_status,
    paymentData.transaction_id,
    paymentData.payment_type,
    paymentData.notes,
    new Date(), // Automatically set payment_date
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
};

// Get payment payment deatil for a student

const getPaymentByApplicationId = async (application_id) => {
  const query = `
    SELECT * FROM payments WHERE application_id = $1
  `;
  const values = [application_id];

  const result = await pool.query(query, values);
  return result.rows[0]; // Assuming a single payment record per application
};


// Update payment status
const updatePaymentsStatusOffline = async (paymentId, status, transactionId) => {
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

// Inistal insert from new_applications linking both table
const insertStudentId = async (paymentData) => {
  const query = `
    INSERT INTO payments (
      student_id, application_id, payment_status
    ) VALUES ($1, $2, $3)
    RETURNING *;
  `;

  const values = [
    paymentData.student_id || null, // Use null if student_id is not provided
    paymentData.application_id, // application_id must be provided here
    paymentData.payment_status || "Pending", // Default to "Pending" if not provided
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
};



// List all payments
const listAllPayments = async () => {
  const query = "SELECT * FROM payments ORDER BY created_at DESC;";
  const result = await pool.query(query);
  return result.rows;
};

module.exports = {
  updatePayment,
  getPaymentByApplicationId,
  updatePaymentsStatusOffline,
  listAllPayments,
  insertStudentId,
  insertPayment,
};