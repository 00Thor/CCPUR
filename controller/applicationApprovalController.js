const pool = require("../config/db");
const { approvedStd } = require("../models/newApplicationModel");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken"); // Import the JSON Web Token library

// Configure the transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/*------------------- NEW APPLICATION (APPROVAL / REJECTION + NOTIFICATION) ----------------*/

//Fetch all pending applications
const getPendingApplications = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM new_applications WHERE status = 'pending'");
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching pending applications:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

//Fetch all pending applications
const getApprovedApplications = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM new_applications WHERE status = 'approved'");
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching pending applications:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Fetch a single application by user_id and application_id
const getSingleApplication = async (req, res) => {
  try {
    const user_id = req.user?.id; // Extract user_id from middleware
  
    if (!user_id) {
      return res.status(400).json({ error: "User ID is required" });
    }

    let query = "SELECT * FROM new_applications WHERE user_id = $1";
    const queryParams = [user_id];

    console.log("Fetching applications for user_id:", user_id);
    
    const result = await pool.query(query, queryParams);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "No applications found for this user" });
    }

    res.json(result.rows[0]); // Return application data
  } catch (error) {
    console.error("Error fetching application details:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


// Approve Applicant & Copy to Students Table
const approveApplicant = async (req, res) => {
  const { application_id } = req.params;
  const client = await pool.connect();
  console.log("Received application_id:", req.params.application_id);

  try {
    await client.query("BEGIN"); // Start transaction

    // Get applicant details
    const applicantQuery = `SELECT * FROM new_applications WHERE application_id = $1`;
    const result = await client.query(applicantQuery, [application_id]);

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Applicant not found" });
    }

    const applicant = result.rows[0];

    // Copy details to student_details using approvedStd function
    const studentData = await approvedStd(applicant);

    const studentId = studentData.student_id; // Capture student_id

    // Move file uploads to student_id
    const updateFilesQuery = `
      UPDATE file_uploads 
      SET student_id = $1, applicant_id = NULL 
      WHERE applicant_id = $2
    `;
    await client.query(updateFilesQuery, [studentId, application_id]);

    // Update the applicant status to "accepted" in new_applications
    await client.query(`UPDATE new_applications SET status = 'approved', accepted_at = NOW() WHERE application_id = $1`, [application_id]);

    await client.query("COMMIT"); // Commit transaction

    // Send approval email
    await transporter.sendMail({
      from: `"College Admin" <${process.env.EMAIL_USER}>`,
      to: applicant.email,
      subject: "Application Approved For CCPUR COLLEGE",
      html: `<p>Congratulations! Your application has been approved. You are now enrolled in ${applicant.program} at CCPUR COLLEGE.</p>`,
    });

    res.status(200).json({
      message: "Applicant approved and copied to student_details",
      student: studentData, // Return the inserted student data
    });

  } catch (error) {
    await client.query("ROLLBACK"); // Rollback on failure
    console.error("Error approving applicant:", error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    client.release();
  }
};


// Reject Application
const rejectApplication = async (req, res) => {
  try {
    const { application_id } = req.params;

    // Fetch applicant details
    const result = await pool.query(
      "SELECT * FROM new_applications WHERE application_id = $1",
      [application_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Application not found" });
    }

    const applicant = result.rows[0];

    // Update application status to 'rejected' and set rejection timestamp
    const updateResult = await pool.query(
      "UPDATE new_applications SET status = 'rejected', rejected_at = NOW() WHERE application_id = $1",
      [application_id]
    );

    if (updateResult.rowCount === 0) {
      return res.status(500).json({ error: "Failed to update application status" });
    }

    // Send rejection email
    await transporter.sendMail({
      from: `"Churachandpur College Admin" <${process.env.EMAIL_USER}>`,
      to: applicant.email,
      subject: "Application Rejected",
      html: `<p>Dear ${applicant.full_name},</p>
             <p>We regret to inform you that your application has been rejected.</p>
             <p>Thank you for your time and interest in Churachandpur College.</p>`,
    });

    // Send a success response
    res.status(200).json({ message: "Application rejected successfully." });
  } catch (error) {
    console.error("Error rejecting application:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


/*  ---------------- 2nd & 3rd YEAR APPLICATION (YEARLY) ----------------------   */

const approveYearlyApplication = async (req, res) => {
  const client = await pool.connect();
  try {
    const { student_id } = req.params;
    await client.query("BEGIN");

    // Check if the student exists
    const studentQuery = `SELECT * FROM student_details WHERE student_id = $1`;
    const studentResult = await client.query(studentQuery, [student_id]);

    if (studentResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Student not found" });
    }

    // Get current semester
    const currentSemester = studentResult.rows[0].current_semester;

    // Determine promotion eligibility
    let newSemester = null;
    if (currentSemester === 2) {
      newSemester = 3;
    } else if (currentSemester === 4) {
      newSemester = 5;
    } else {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Student is not eligible for promotion." });
    }

    // Update the student's semester
    const updateQuery = `UPDATE student_details SET current_semester = $1 WHERE student_id = $2`;
    await client.query(updateQuery, [newSemester, student_id]);

    // Commit transaction
    await client.query("COMMIT");

    return res.status(200).json({ 
      message: `Application Approved: Student promoted to semester ${newSemester}.` 
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error approving yearly application:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  } finally {
    client.release();
  }
};


module.exports = { getPendingApplications, approveApplicant, 
  rejectApplication, getSingleApplication,
  getApprovedApplications, approveYearlyApplication};
