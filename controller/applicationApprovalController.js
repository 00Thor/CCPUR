const pool = require("../config/db");
const { approvedStd } = require("../models/newApplicationModel");
const nodemailer = require("nodemailer");

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

const getSingleApplication = async (req, res) => {
  const { application_id } = req.params; // Get application_id from URL params
  const { full_name } = req.query; // Get full_name from query parameters

  try {
    let query = "SELECT * FROM new_applications WHERE ";
    let values = [];

    if (application_id) {
      query += "application_id = $1";
      values.push(application_id);
    } else if (full_name) {
      query += "full_name ILIKE $1"; // Case-insensitive search
      values.push(`%${full_name}%`); // Allows partial name matching
    } else {
      return res.status(400).json({ error: "Provide either application_id or full_name" });
    }

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Application not found" });
    }

    res.json({ application: result.rows });

  } catch (error) {
    console.error("Error fetching application details:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


// Approve Applicant & Move to Students Table
const approveApplicant = async (req, res) => {
  const { application_id } = req.params;
  const client = await pool.connect();

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

     // Insert into student_details using approvedStd function
     const studentData = await approvedStd(applicant);

     const studentId = studentData.student_id; // Capture student_id

    // Move file uploads to student_id
    const updateFilesQuery = `
      UPDATE file_uploads 
      SET student_id = $1, applicant_id = NULL 
      WHERE applicant_id = $2
    `;
    await client.query(updateFilesQuery, [studentId, application_id]);

     // Delete the applicant from new_applications
    await client.query(`DELETE FROM new_applications WHERE application_id = $1`, [application_id]);

    await client.query("COMMIT"); // Commit transaction

    // Send approval email
    await transporter.sendMail({
      from: `"College Admin" <${process.env.EMAIL_USER}>`,
      to: applicant.email,
      subject: "Application Approved",
      html: `<p>Congratulations! Your application has been approved. You are now enrolled in ${applicant.program} at CCPUR COLLEGE.</p>`,
    });

    res.status(200).json({
      message: "Applicant approved and moved to student_details",
      student: studentInsert.rows[0],
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
    const result = await pool.query("SELECT * FROM new_applications WHERE application_id = $1", [application_id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Application not found" });
    }
    const applicant = result.rows[0];

    // Update application status to 'rejected'
    await pool.query("UPDATE new_applications SET status = 'rejected' WHERE application_id = $1", [application_id]);

    // Send rejection email
    await transporter.sendMail({
      from: `"College Admin" <${process.env.EMAIL_USER}>`,
      to: applicant.email,
      subject: "Application Rejected",
      html: `<p>We regret to inform you that your application has been rejected.</p>`,
    });

    res.json({ message: "Application rejected" });
  } catch (error) {
    console.error("Error rejecting application:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

/*  ---------------- NEW SEMESTER APPLICATION (YEARLY) ----------------------   */





module.exports = { getPendingApplications, approveApplicant, rejectApplication, getSingleApplication};
