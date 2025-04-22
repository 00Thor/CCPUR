const pool =require("../config/db");
const bcrypt = require("bcryptjs");
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

    const missingFields = requiredFields.filter((field) => !studentData[field]);
    if (missingFields.length > 0) {
      return res
        .status(400)
        .json({ error: `Missing fields: ${missingFields.join(", ")}` });
    }

    const userQuery = "SELECT user_id FROM users WHERE email = $1";
    const userResult = await client.query(userQuery, [studentData.email]);
    if (userResult.rowCount === 0) {
      return res
        .status(404)
        .json({ error: "Email must match with the registered email." });
    }
    const userId = userResult.rows[0].user_id;

    const conflictQuery = `
      SELECT * FROM new_applications
      WHERE user_id = $1 OR email = $2
    `;
    const conflictResult = await client.query(conflictQuery, [
      userId,
      studentData.email,
    ]);
    if (conflictResult.rowCount > 0) {
      const conflictingRow = conflictResult.rows[0];
      let conflictMessage = "An application already exists with the provided ";
      if (conflictingRow.user_id === userId) conflictMessage += "User ID.";
      else if (conflictingRow.email === studentData.email)
        conflictMessage += "Email.";
    }

    const applicantResult = await newStudentDetails(
      { ...studentData, user_id: userId },
      client
    );
    const applicantId = applicantResult?.application_id;
    if (!applicantId) throw new Error("Failed to insert student details.");

    req.body.user_id = userId;
    req.body.application_id = applicantId;

    try {
      await studentFilesUpload(req, client);
    } catch (fileUploadError) {
      throw new Error(`File upload failed: ${fileUploadError.message}`);
    }

    const paymentData = { application_id: applicantId };
    await insertStudentId(paymentData, client);


    await client.query("COMMIT");

    return res.status(201).json({
      message: "Application submitted successfully.",
      applicationId: applicantId,
      userId: userId,
    });
  } catch (error) {
    console.error("Error processing application:", error.message);


    if (client) await client.query("ROLLBACK");

    return res
      .status(500)
      .json({ error: "Server error. Please try again later." });
  } finally {
    if (client) client.release();
  }
};

// Admin add new student
const addNewStudentByAdmin = async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    await client.query("BEGIN");

    const studentData  = req.body;
    const password = "CcpurCollege@123";
    const program = studentData.course; 
    const hashedPassword = await bcrypt.hash(password, 10);
    const userQuery = `
      INSERT INTO users (name, email, program, password) 
      VALUES ($1, $2, $3, $4) 
      RETURNING user_id
    `;
    const userResult = await client.query(userQuery, [
      studentData.full_name,
      studentData.email,
      program,
      hashedPassword,
    ]);

    if (userResult.rowCount === 0) {
      throw new Error("Error inserting new user.");
    }
    const userId = userResult.rows[0].user_id;
    const requiredFields = [
      "session", "full_name", "date_of_birth", "aadhaar_no", "gender", "category",
      "nationality", "religion", "name_of_community", "contact_no", "blood_group",
      "email", "fathers_name", "fathers_occupation", "mothers_name", "mothers_occupation",
      "permanent_address", "present_address",
      "hslc_board", "hslc_rollno", "hslc_year", "hslc_div", "hslc_tmarks", "hslc_inst",
      "classxii_board", "classxii_rollno", "classxii_year", "classxii_div", "classxii_tmarks",
      "classxii_inst", "course", "mil", "subject", "agree", "pincode"
    ];
    const missingFields = requiredFields.filter((field) => !studentData[field]);
    if (missingFields.length > 0) {
      throw new Error(`Missing fields: ${missingFields.join(", ")}`);
    }
    const applicationResult = await newStudentDetails(
      { ...studentData, user_id: userId },
      client
    );
    const applicationId = applicationResult?.application_id;
    if (!applicationId) {
      throw new Error("Error inserting student details.");
    }
    req.body.application_id = applicationId;
    try {
      await studentFilesUpload(req, client);
    } catch (error) {
      throw new Error(`File upload failed: ${error.message}`);
    }
    const paymentData = { application_id: applicationId };
    await insertStudentId(paymentData, client);

    await client.query("COMMIT");

    return res.status(201).json({
      message: "Student and application created successfully.",
      userId,
      applicationId,
    });
  } catch (error) {
    console.error("Error adding new student:", error.message);
    if (client) await client.query("ROLLBACK");
    return res.status(500).json({
      error: "Server error. Please try again later.",
    });
  } finally {
    if (client) client.release();
  }
};

module.exports = { newStudentApplication, addNewStudentByAdmin };
