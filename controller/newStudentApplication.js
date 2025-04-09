const pool = require("../config/db");
const { newStudentDetails } = require("../models/newApplicationModel");
const { studentFilesUpload } = require("./studentFileUploadController");
const { insertStudentId } = require("../models/paymentModel");

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
      "permanent_address", "present_address",
      "hslc_board", "hslc_rollno", "hslc_year", "hslc_div", "hslc_tmarks", "hslc_inst",
      "classxii_board", "classxii_rollno", "classxii_year", "classxii_div", "classxii_tmarks",
      "classxii_inst", "course", "mil", "subject", "agree", "pincode"
    ];

    // Validate required fields
    const missingFields = requiredFields.filter((field) => !studentData[field]);
    if (missingFields.length > 0) {
      return res
        .status(400)
        .json({ error: `Missing fields: ${missingFields.join(", ")}` });
    }

    // Verify user exists
    const userQuery = "SELECT user_id FROM users WHERE email = $1";
    const userResult = await client.query(userQuery, [studentData.email]);
    if (userResult.rowCount === 0) {
      return res
        .status(404)
        .json({ error: "Email must match with the registered email." });
    }
    const userId = userResult.rows[0].user_id;

    // Check for conflicts
    const conflictQuery = `
      SELECT * FROM new_applications
      WHERE user_id = $1 OR email = $2 OR aadhaar_no = $3
    `;
    const conflictResult = await client.query(conflictQuery, [
      userId,
      studentData.email,
      studentData.aadhaar_no,
    ]);
    if (conflictResult.rowCount > 0) {
      const conflictingRow = conflictResult.rows[0];
      let conflictMessage = "An application already exists with the provided ";
      if (conflictingRow.user_id === userId) conflictMessage += "User ID.";
      else if (conflictingRow.email === studentData.email)
        conflictMessage += "Email.";
      else if (conflictingRow.aadhaar_no === studentData.aadhaar_no)
        conflictMessage += "Aadhaar number.";
      return res.status(409).json({ error: conflictMessage });
    }

    // Insert personal details
    const applicantResult = await newStudentDetails(
      { ...studentData, user_id: userId },
      client // Use transaction client
    );
    const applicantId = applicantResult?.application_id;
    if (!applicantId) throw new Error("Failed to insert student details.");

    req.body.user_id = userId;
    req.body.application_id = applicantId;

    // Perform file uploads
    try {
      await studentFilesUpload(req, client); // Use transaction client
    } catch (fileUploadError) {
      throw new Error(`File upload failed: ${fileUploadError.message}`);
    }

    // Insert payment details
    const paymentData = { application_id: applicantId };
    await insertStudentId(paymentData, client);

    // Commit transaction
    await client.query("COMMIT");


    return res.status(201).json({
      message: "Application submitted successfully.",
      applicationId: applicantId,
      userId: userId,
    });
  } catch (error) {
    console.error("Error processing application:", error.message);

    // Rollback the transaction on any error
    if (client) await client.query("ROLLBACK");

    return res
      .status(500)
      .json({ error: "Server error. Please try again later." });
  } finally {
    if (client) client.release(); // Release the client back to the pool
  }
};

module.exports = { newStudentApplication };
