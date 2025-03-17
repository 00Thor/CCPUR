const pool = require("../config/db");

const fetchFeeDetails = async (req, res) => {
  try {
    const { payment_type, stream } = req.query; // Read from query parameters

    // Validate input
    if (!payment_type || !stream) {
      return res.status(400).json({ error: "Payment type & stream are required" });
    }

    // Fetch the price from the database
    const feeQuery = "SELECT amount FROM fee_pricing WHERE payment_type = $1 AND stream = $2";
    const feeResult = await pool.query(feeQuery, [payment_type, stream]);

    // Handle no results found
    if (feeResult.rows.length === 0) {
      return res.status(404).json({ error: "No pricing found for the provided inputs." });
    }

    // Return the pricing details
    const amount = feeResult.rows[0].amount;
    res.status(200).json({ amount });
  } catch (error) {
    console.error("Error fetching fee details:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

  module.exports = { fetchFeeDetails };