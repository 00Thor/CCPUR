const pool = require("../config/db");

// Fetch application statistics
const fetchStatistics = async (req, res) => {
  try {
    // Count total number of applications
    const totalApplicationsQuery = `SELECT COUNT(*) AS total FROM new_applications`;
    const totalApplicationsResult = await pool.query(totalApplicationsQuery);
    const totalApplications = parseInt(totalApplicationsResult.rows[0].total, 10);

    // Count applications by gender
    const genderDistributionQuery = `
      SELECT gender, COUNT(*) AS count 
      FROM new_applications 
      GROUP BY gender`;
    const genderDistributionResult = await pool.query(genderDistributionQuery);
    const genderDistribution = genderDistributionResult.rows.reduce((acc, row) => {
      acc[row.gender] = parseInt(row.count, 10);
      return acc;
    }, {});

    // (Optional) Add program distribution or other statistics here
    const programDistributionQuery = `
      SELECT course, COUNT(*) AS count 
      FROM new_applications 
      GROUP BY course`;
    const programDistributionResult = await pool.query(programDistributionQuery);
    const programDistribution = programDistributionResult.rows.reduce((acc, row) => {
      acc[row.course] = parseInt(row.count, 10);
      return acc;
    }, {});

    // Send the statistics as a response
    res.json({
      totalApplications,
      genderDistribution,
      programDistribution,
    });
  } catch (error) {
    console.error("Error fetching application statistics:", error);
    res.status(500).json({ error: "Failed to fetch application statistics." });
  }
};

module.exports = { fetchStatistics };
