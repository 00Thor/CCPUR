// controllers/paymentController.js

const paymentModel = require('../models/paymentModel');

const insertPaymentController = async (req, res) => {
  try {
    const paymentDetails = req.body;
    const insertedPayment = await paymentModel.insertPayment(paymentDetails);
    res.status(201).json(insertedPayment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to insert payment', details: error.message });
  }
};

const getPaymentsByStudentIdController = async (req, res) => {
  try {
    const { student_id } = req.params;
    const payments = await paymentModel.getPaymentsByStudentId(student_id);
    res.status(200).json(payments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch payments', details: error.message });
  }
};

const updatePaymentStatusController = async (req, res) => {
  try {
    const { payment_id, status } = req.body;
    const updatedPayment = await paymentModel.updatePaymentStatus(payment_id, status);
    res.status(200).json(updatedPayment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update payment status', details: error.message });
  }
};

module.exports = {
  insertPaymentController,
  getPaymentsByStudentIdController,
  updatePaymentStatusController,
};
