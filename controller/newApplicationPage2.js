const pool = require("../config/db");
const { uploadFiles } = require("../controller/fileUploadController");

const submitEducationalDetailsAndFiles = async (req, res) => {
  try {
    const {
      applicantId, userId, hslc_board, hslc_rollno, hslc_year, hslc_div, hslc_tmarks, hslc_inst,
      classxii_board, classxii_rollno, classxii_year, classxii_div, classxii_tmarks, classxii_inst,
      course, mil, subject, agree,
    } = req.body;

    if (!applicantId || !userId) {
      return res.status(400).json({ error: "Applicant ID and User ID are required." });
    }

    // Update educational details in new_applications table
    const updateQuery = `
      UPDATE new_applications
      SET hslc_board = $1, hslc_rollno = $2, hslc_year = $3, hslc_div = $4, hslc_tmarks = $5, hslc_inst = $6,
          classxii_board = $7, classxii_rollno = $8, classxii_year = $9, classxii_div = $10, classxii_tmarks = $11,
          classxii_inst = $12, course = $13, mil = $14, subject = $15, agree = $16
      WHERE application_id = $17 AND user_id = $18
    `;
    await pool.query(updateQuery, [
      hslc_board, hslc_rollno, hslc_year, hslc_div, hslc_tmarks, hslc_inst,
      classxii_board, classxii_rollno, classxii_year, classxii_div, classxii_tmarks, classxii_inst,
      course, mil, subject, agree, applicantId, userId,
    ]);

    // Delegate file uploads to the fileUpload controller
    await uploadFiles(req, res);

    res.status(200).json({
      message: "Educational details and files submitted successfully.",
    });
  } catch (error) {
    console.error("Error submitting educational details and files:", error);
    res.status(500).json({ error: "Server error. Please try again later." });
  }
};

module.exports = { submitEducationalDetailsAndFiles };
