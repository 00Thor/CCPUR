const pool = require("../config/db");

// Fetch application statistics
const fetchApplicationStatistics = async (req, res) => {
  try {
    // Query with parameterized inputs for security
    const query = `
      WITH 
    course_fee_stats AS (
    SELECT 
      na.course,
      fp.amount AS admission_fee,  -- Replaced with 'amount'
      COUNT(na.application_id) AS total_applications,
      COALESCE(SUM(p.amount), 0) AS total_paid
    FROM 
      new_applications na
    LEFT JOIN 
      payments p ON na.application_id = p.application_id AND p.payment_status = 'Paid'
    JOIN 
      fee_pricing fp ON na.course = fp.course
    GROUP BY 
      na.course, fp.amount
    )
    SELECT 
      COUNT(DISTINCT application_id) AS total_applications,
      COUNT(CASE WHEN status = 'pending' THEN 1 END) AS total_pending,
      COUNT(CASE WHEN status = 'approved' THEN 1 END) AS total_approved,
      COUNT(CASE WHEN gender = 'Male' THEN 1 END) AS total_male_applicant,
      COUNT(CASE WHEN gender = 'Female' THEN 1 END) AS total_female_applicant,
      COUNT(CASE WHEN course = 'B.A' THEN 1 END) AS total_BA_applicant,
      COUNT(CASE WHEN course = 'B.Sc' THEN 1 END) AS total_BSc_applicant,
      COALESCE((SELECT SUM(amount) FROM payments WHERE payment_status = 'paid'), 0) AS total_fees_collected
      
    FROM 
      new_applications;

    `;

    const result = await pool.query(query);

    // Sending the result back to the client
    res.status(200).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error executing query:", error.message);
    res.status(500).json({
      success: false,
      error: "Failed to fetch admin dashboard statistics.",
    });
  }
};

// Admin Dashboard Statics

const adminDashboardStats = async (req, res) => {
  try {
    const query = `
      SELECT
       
        COUNT(CASE WHEN gender = 'Male' THEN 1 END) AS total_male_students,
        COUNT(CASE WHEN gender = 'Female' THEN 1 END) AS total_female_students,

        (SELECT COUNT(CASE WHEN gender = 'Male' THEN 1 END) FROM faculty) AS total_male_faculty,
        (SELECT COUNT(CASE WHEN gender = 'Female' THEN 1 END) FROM faculty) AS total_female_faculty,
        (SELECT COUNT(CASE WHEN type = 'Teaching' THEN 1 END) FROM faculty) AS total_t_faculty,
        (SELECT COUNT(CASE WHEN type = 'Non-Teaching' THEN 1 END) FROM faculty) AS total_nt_faculty,
        (SELECT COUNT(DISTINCT faculty_id) FROM faculty) AS total_faculty,
        
        COUNT(CASE WHEN course = 'B.A' THEN 1 END) AS total_BA_students,
        COUNT(CASE WHEN course = 'B.Sc' THEN 1 END) AS total_BSc_students,
        
        
        COUNT(DISTINCT student_id) AS total_students,
        
        
        COALESCE((SELECT SUM(amount) FROM payments WHERE payment_status = 'paid'), 0) AS total_fees_collected
      FROM
        student_details;
    `;

    const result = await pool.query(query);

    // Sending the result back to the client
    res.status(200).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error executing query:", error.message);
    res.status(500).json({
      success: false,
      error: "Failed to fetch admin dashboard statistics.",
    });
  }
};

module.exports = { fetchApplicationStatistics, adminDashboardStats };
