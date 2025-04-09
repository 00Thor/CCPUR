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
    const query = `
      SELECT 
          na.user_id,
          na.application_id,
          na.full_name, 
          na.contact_no,
          na.course,
          na.subject,
          na.status, 
          p.payment_status
      FROM 
          new_applications na
      LEFT JOIN 
          payments p
      ON 
          na.application_id = p.application_id
      WHERE 
          na.status = 'pending';
    `;

    console.log("Fetching all pending applications");

    const result = await pool.query(query);

    if (result.rows.length === 0) {
      return res.status(200).json([]);
    }

    res.json(result.rows); // Return all pending applications with payment_status
  } catch (error) {
    console.error("Error fetching pending applications:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Fetch a single application by application_id

const getSingleApplication = async (req, res) => {
  try {
    const { user_id } = req.params; // Extract user_id from request params

    if (!user_id) {
      return res.status(400).json({ error: "User ID is missing in params" });
    }

    // Query to fetch all details from new_applications and amount from fee_pricing
    const query = `
      SELECT 
        na.*, 
        fp.amount
      FROM 
        new_applications na
      INNER JOIN 
        fee_pricing fp 
      ON 
        na.course = fp.course
      WHERE 
        na.user_id = $1
    `;

    const queryParams = [user_id];

    //console.log("Fetching application details for user_id:", user_id);

    const result = await pool.query(query, queryParams);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Application not found" });
    }

    res.json(result.rows[0]); // Return all details from new_applications and the amount
  } catch (error) {
    console.error("Error fetching application details:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// GET own APPLICATION(For student in the std applications dashboard)

const getSingleApps = async (req, res) => {
  try {
    // Extract token from headers
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "Authorization token is missing" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const { user_id } = decoded;
    if (!user_id) {
      return res.status(400).json({ error: "Invalid token: user ID missing" });
    }

    console.log("Fetching dashboard data for user_id:", user_id);

    // Extract application_id from request query or params
    const { application_id } = req.query;

    // Query to fetch user application details
    const appDetailsQuery = `
      SELECT 
        na.*, 
        fp.payment_status
      FROM 
        new_applications na
      INNER JOIN 
        payments fp 
      ON 
        na.application_id = fp.application_id
      WHERE 
        na.user_id = $1;
    `;
    const appDetailsParams = [user_id];

    const staticBaseUrl = `${process.env.SERVER_URL || "http://localhost:5000"}`;

    // Build dynamic query for fetching files
    let filesQuery;
    let filesParams;

    if (application_id) {
      // Fetch files by application_id
      filesQuery = `
        SELECT passport,
          signature,
          tribe,
          xadmitcard, 
          xiiadmitcard, 
          xmarksheet, 
          xiimarksheet, 
          migration
        FROM file_uploads 
        WHERE application_id = $1
      `;
      filesParams = [application_id];
    } else {
      // Fetch files by user_id (default)
      filesQuery = `
        SELECT passport,
          signature,
          tribe,
          xadmitcard, 
          xiiadmitcard, 
          xmarksheet, 
          xiimarksheet, 
          migration
        FROM file_uploads 
        WHERE user_id = $1
      `;
      filesParams = [user_id];
    }

    // Execute both queries in parallel
    const [appDetailsResult, filesResult] = await Promise.all([
      pool.query(appDetailsQuery, appDetailsParams),
      pool.query(filesQuery, filesParams),
    ]);

    // Transform file paths to static URLs
    const files = filesResult.rows[0];
    const pathLib = require("path");
    const updatedFiles = files
    ? Object.fromEntries(
        Object.entries(files).map(([key, filePath]) => {
          const fileName = filePath ? pathLib.basename(filePath) : null;
          return [key, fileName ? `${staticBaseUrl}/${fileName}` : null];
        })
      )
    : {};

    // Construct response
    const dashboardData = {
      applications: appDetailsResult.rows[0] || {},
      files: updatedFiles,
    };

    // Respond with combined data
    res.status(200).json(dashboardData);
  } catch (error) {
    console.error("Error fetching single application data:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Approve Applicant & Copy to Students Table
const approveApplicant = async (req, res) => {
  const { application_id } = req.params;
  const client = await pool.connect();
  console.log("Received application_id:", application_id);

  try {
    await client.query("BEGIN");

    // 1. Get applicant details
    const applicantQuery = `SELECT * FROM new_applications WHERE application_id = $1`;
    const result = await client.query(applicantQuery, [application_id]);

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Applicant not found" });
    }

    const applicant = result.rows[0];
    const course = applicant.course;

    // 2. Copy to students table
    const studentData = await approvedStd(applicant);
    const studentId = studentData.student_id;

    // 3. Move files to student_id
    const updateFilesQuery = `
      UPDATE file_uploads 
      SET student_id = $1, application_id = NULL 
      WHERE application_id = $2
    `;
    await client.query(updateFilesQuery, [studentId, application_id]);

    // 4. Update applicant status
    await client.query(
      `UPDATE new_applications SET status = 'approved', accepted_at = NOW() WHERE application_id = $1`,
      [application_id]
    );

    // 5. Check current payment record
    const paymentCheck = await client.query(
      `SELECT payment_status, amount FROM payments WHERE application_id = $1`,
      [application_id]
    );

    const paymentRecord = paymentCheck.rows[0];

    if (
      !paymentRecord ||
      paymentRecord.payment_status !== "paid" ||
      paymentRecord.amount === null
    ) {
      // 6. Get fee from fee_pricings table
      const feeQuery = `SELECT amount FROM fee_pricings WHERE course = $1 LIMIT 1`;
      const feeResult = await client.query(feeQuery, [course]);

      if (feeResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return res
          .status(400)
          .json({ error: "Fee not found for the selected course" });
      }

      const feeAmount = feeResult.rows[0].amount;

      // 7. Update or insert payment record
      if (paymentRecord) {
        await client.query(
          `UPDATE payments SET amount = $1, payment_status = 'paid' WHERE application_id = $2`,
          [feeAmount, application_id]
        );
      } 
    }
    await client.query("COMMIT");

    // Send approval email
    await transporter.sendMail({
      from: `"College Admin" <${process.env.EMAIL_USER}>`,
      to: applicant.email,
      subject: "Application Approved For CCPUR COLLEGE",
      html: `<p>💥 *Listen up, future game-changer!* 💥</p>  
              <p>Your application has been APPROVED. Not surprised, though – CCPUR COLLEGE doesn’t take just anyone. You’ve earned your spot, and you’re now officially enrolled in <strong>${applicant.course}</strong>. 🦾</p>  
              <p>Welcome to the grind. No excuses. No limits. This is where the weak are separated from the strong, and the strong become unstoppable. 💯</p>  
              <p>Sharpen your mind. Prepare for glory. It’s time to dominate. See you at the top. 🔥</p>  
              <p><strong>CCPUR COLLEGE: Where Alphas Rise. 🐺</strong></p>

      `,
    });

    res.status(200).json({
      message: "Application approved",
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
      return res
        .status(500)
        .json({ error: "Failed to update application status" });
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
    res.status(200).json({ message: "Application rejected." });
  } catch (error) {
    console.error("Error rejecting application:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

//Fetch all Approved applications
const getApprovedApplications = async (req, res) => {
  try {
    const query = `
      SELECT 
          na.user_id,
          na.full_name, 
          na.contact_no,
          na.course,
          na.subject,
          na.status,
          p.payment_status
      FROM 
          new_applications na
      LEFT JOIN 
          payments p
      ON 
          na.application_id = p.application_id
      WHERE 
          na.status = 'approved';
    `;

    console.log("Fetching all approved applications");

    const result = await pool.query(query);

    if (result.rows.length === 0) {
      return res.status(200).json([]);
    }

    res.json(result.rows); // Return all pending applications with payment_status
  } catch (error) {
    console.error("Error fetching approved applications:", error.message);
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
      return res
        .status(400)
        .json({ error: "Student is not eligible for promotion." });
    }

    // Update the student's semester
    const updateQuery = `UPDATE student_details SET current_semester = $1 WHERE student_id = $2`;
    await client.query(updateQuery, [newSemester, student_id]);

    // Commit transaction
    await client.query("COMMIT");

    return res.status(200).json({
      message: `Application Approved: Student promoted to semester ${newSemester}.`,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error approving yearly application:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  } finally {
    client.release();
  }
};

module.exports = {
  getPendingApplications,
  approveApplicant,
  rejectApplication,
  getSingleApps,
  getSingleApplication,
  getApprovedApplications,
  approveYearlyApplication,
};
