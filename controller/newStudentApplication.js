const pool = require("../config/db");
const { newStudentDetails } = require("../models/newApplicationModel");
const { studentFilesUpload } = require("../controller/fileUploadController");

const newStudentApplication = async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    await client.query("BEGIN");

    const studentData = req.body;
    const requiredFields = [
      "session", "full_name", "date_of_birth", "aadhaar_no", "gender", "category",
      "nationality", "religion", "name_of_community", "contact_no", "blood_group",
      "email", "fathers_name", "fathers_occupation", "mothers_name", "mothers_occupation",
      "permanent_address", "present_address", "guardian_name", "guardian_address",
      "hslc_board", "hslc_rollno", "hslc_year", "hslc_div", "hslc_tmarks", "hslc_inst",
      "classxii_board", "classxii_rollno", "classxii_year", "classxii_div", "classxii_tmarks",
      "classxii_inst", "course", "mil", "subject", "agree", "pincode"
    ];

    const missingFields = requiredFields.filter((field) => !studentData[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({ error: `Missing fields: ${missingFields.join(", ")}` });
    }

    const userQuery = "SELECT user_id FROM users WHERE email = $1";
    const userResult = await client.query(userQuery, [studentData.email]);
    if (userResult.rowCount === 0) {
      return res.status(404).json({ error: "User not found." });
    }

    const userId = userResult.rows[0].user_id;
    const applicantResult = await newStudentDetails({ ...studentData, user_id: userId });
    const applicantId = applicantResult?.application_id;

    if (!applicantId) {
      return res.status(500).json({ error: "Failed to insert student details." });
    }

    req.body.user_id = userId;
    req.body.applicant_id = applicantId;

    await studentFilesUpload(req);

    await client.query("COMMIT");

    return res.status(201).json({
      message: "Application submitted successfully.",
      applicationId: applicantId,
      userId: userId,
    });
  } catch (error) {
    console.error("Error processing application:", error.message);
    if (client) await client.query("ROLLBACK");
    return res.status(500).json({ error: "Server error. Please try again later." });
  } finally {
    if (client) client.release();
  }
};

module.exports = { newStudentApplication };
