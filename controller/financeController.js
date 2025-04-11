const pool = require("../config/db");
const Rajorpay = require("razorpay");
require("dotenv").config();

// Get all payments within a speci

const allPaymentReceiptsByDate = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      throw new Error("Start date and end date are required.");
    }
    const query = `
      SELECT *
      FROM payments
      WHERE payment_date BETWEEN $1 AND $2;
    `;
    const result = await pool.query(query, [startDate, endDate]);
    res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Error fetching payments by date:", error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Rajorpay receipt
const razorPay = new Rajorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});
const razorpayReceipt = async (req, res) => {
  try {
    const { transaction_id } = req.params;
    if (!transaction_id) {
      return res.status(400).json({ error: "No transaction ID provided" });
    }
    console.log("Transaction ID:", transaction_id);
    const payment = await razorPay.payments.fetch(transaction_id);
    console.log("Payment Details:", payment);
    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }
    const receiptId = payment.receipt || "No Receipt Associated";
    console.log("Receipt ID:", receiptId);
    // Format amount to proper currency format
    payment.amount = (payment.amount / 100).toFixed(2);
    payment.fee = (payment.fee / 100).toFixed(2);
    payment.tax = payment.tax ? (payment.tax / 100).toFixed(2) : null;


    res.status(200).json({
      success: true,
      payment_details: payment,
      receipt_id: receiptId,
    });
  } catch (error) {
    console.error("Error fetching Razorpay receipt:", error.message);

    res.status(500).json({
      error: "Internal Server Error",
      message: error.message,
    });
  }
};

// set fee & other pricing
const feePricing = async (req, res) => {
  try {
    const { amount, payment_type, course } = req.body;

    if (!amount || !payment_type) {
      throw new Error("Please provide all details");
    }

    const query = `
      UPDATE fee_pricing 
      SET amount = $1 
      WHERE payment_type = $2 AND course = $3 
      RETURNING *;
    `;

    const results = await pool.query(query, [amount, payment_type, course]);

    if (results.rowCount === 0) {
      return res.status(404).json({ success: false, message: "No matching record found to update" });
    }

    return res.status(200).json({
      success: true,
      message: "Fee pricing updated successfully",
      updatedRecord: results.rows[0],
    });

  } catch (error) {
    console.error("Error updating fee pricing:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getFeePpricing = async(req, res) =>{
  try{
        const query = 'SELECT * FROM fee_pricing;';
        const result = await pool.query(query);

        return res.status(200).json({
          success:true,
          data: result.rows,
        });
  }catch(error){
    console.log("Somthins bussin fr fr", error.message);
    return res.status(500).json({success: false, message: error.message});
  }
}
module.exports ={ 
  razorpayReceipt,
  allPaymentReceiptsByDate,
  feePricing,
  getFeePpricing
};
