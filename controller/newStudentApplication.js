const { newStudentDetails } = require("../models/newApplicationModel");
const pool = require("../config/db");

const submitPersonalDetails = async (req, res) => {
  try {
    const studentData = req.body;

    // Required fields for personal details
    const personalFields = [
      "session", "full_name", "date_of_birth", "aadhaar_no", "sex", "category",
      "nationality", "religion", "name_of_community", "contact_no", "blood_group",
      "email", "fathers_name", "fathers_occupation", "mothers_name", "mothers_occupation",
      "permanent_address", "present_address", "pincode"
    ];

    // Check for missing fields
    const missingFields = personalFields.filter((field) => !studentData[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({ error: `Missing fields: ${missingFields.join(", ")}` });
    }

    // Fetch user_id using the email
    const userQuery = "SELECT user_id FROM users WHERE email = $1";
    const userRes = await pool.query(userQuery, [studentData.email]);

    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: "User not found. Please register first." });
    }

    const userID = userRes.rows[0].user_id;

    // Add user_id to studentData
    studentData.user_id = userID;

    // Insert personal details into new_applications
    const applicantResult = await newStudentDetails(studentData);
    const applicantId = applicantResult?.application_id;

    if (!applicantId) {
      return res.status(500).json({ error: "Failed to insert personal details. Missing applicant ID." });
    }

    return res.status(201).json({
      message: "Personal details submitted successfully",
      applicantId,
      userID,
    });
  } catch (error) {
    console.error("Error submitting personal details:", error);
    res.status(500).json({ error: "Server error. Please try again later." });
  }
};

module.exports = { submitPersonalDetails };
