// models/paymentModel.js
const pool = require('../config/db'); // Assuming you have a pool setup with pg

// Insert payment into the database
const insertPayment = async (paymentDetails) => {
  const { student_id, application_id, amount, payment_method, transaction_id } = paymentDetails;
  const client = await pool.connect();

  try {
    const result = await client.query(`
      INSERT INTO payments (student_id, application_id, amount, payment_method, transaction_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `, [student_id, application_id, amount, payment_method, transaction_id]);

    console.log('✅ Payment inserted:', result.rows[0]);
    return result.rows[0]; // Return the inserted payment record
  } catch (error) {
    console.error('❌ Error inserting payment:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Get payments by student ID
const getPaymentsByStudentId = async (student_id) => {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT * FROM payments WHERE student_id = $1;
    `, [student_id]);

    return result.rows; // Return payments for the student
  } catch (error) {
    console.error('❌ Error fetching payments:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Update payment status
const updatePaymentStatus = async (payment_id, status) => {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      UPDATE payments
      SET payment_status = $1, updated_at = NOW()
      WHERE payment_id = $2
      RETURNING *;
    `, [status, payment_id]);

    return result.rows[0]; // Return the updated payment record
  } catch (error) {
    console.error('❌ Error updating payment status:', error);
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  insertPayment,
  getPaymentsByStudentId,
  updatePaymentStatus,
};
