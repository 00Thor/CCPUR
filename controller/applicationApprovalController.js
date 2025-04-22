const pool = require("../config/db");
const { approvedStd } = require("../models/newApplicationModel");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");

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


//Fetch all pending applications
const getRejectedApplications = async (req, res) => {
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
          p.payment_status,
          CASE WHEN na.status = 'rejected' THEN 'Valid Rejected' ELSE 'Not Rejected' END AS status_check
      FROM 
          new_applications na
      LEFT JOIN 
          payments p
      ON 
          na.application_id = p.application_id
      WHERE 
          na.status = 'rejected';
    `;

    const result = await pool.query(query);

    if (result.rows.length === 0) {
      return res.status(200).json([]);
    }

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching rejected applications:", error.message);
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
    const { user_id } = req.params;

    if (!user_id) {
      return res.status(400).json({ error: "User ID is required." });
    }

    console.log("Fetching dashboard data for user_id:", user_id);

    // Extract `application_id` from query parameters if provided
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

    const query = `
    SELECT passport, signature, tribe, xadmitcard, xiiadmitcard, xmarksheet, xiimarksheet, migration
    FROM file_uploads
    WHERE user_id = $1
  `;

    // Execute queries in parallel
    const [appDetailsResult, filesResult] = await Promise.all([
      pool.query(appDetailsQuery, appDetailsParams),
      pool.query(query, appDetailsParams),
    ]);

    if (filesResult.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Files not found for the given user" });
    }
    const {
      passport,
      signature,
      tribe,
      xadmitcard,
      xiiadmitcard,
      xmarksheet,
      xiimarksheet,
      migration,
    } = filesResult.rows[0];

    const files = {
      passport_url: passport || null,
      signature_url: signature || null,
      tribe_url: tribe || null,
      xadmitcard_url: xadmitcard || null,
      xiiadmitcard_url: xiiadmitcard || null,
      xmarksheet_url: xmarksheet || null,
      xiimarksheet_url: xiimarksheet || null,
      migration_url: migration || null,
    };

    // Prepare the response data
    const dashboardData = {
      applications: appDetailsResult.rows[0] || {},
      files: files || {}, // Files are fetched directly as URLs
    };

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
      throw new Error("Applicant not found");
    }

    const applicant = result.rows[0];
    const course = applicant.course;

    // 2. Copy to students table
    const studentData = await approvedStd(applicant, client);
    if (!studentData || !studentData.student_id) {
      throw new Error("Failed to copy applicant to students table.");
    }
    const studentId = studentData.student_id;

    // 3. Update file uploads and fetch fee concurrently
    const [updateFilesResult, feeResult] = await Promise.all([
      client.query(
        `UPDATE file_uploads SET student_id = $1, application_id = NULL WHERE application_id = $2`,
        [studentId, application_id]
      ),
      client.query(
        `SELECT amount, payment_type FROM fee_pricing WHERE course = $1 LIMIT 1`,
        [course]
      ),
    ]);

    if (feeResult.rows.length === 0) {
      throw new Error("Fee not found for the selected course");
    }

    const { amount: feeAmount, payment_type } = feeResult.rows[0];

    // 4. Update applicant status
    const updateApplicantResult = await client.query(
      `UPDATE new_applications SET status = 'approved', accepted_at = NOW() WHERE application_id = $1`,
      [application_id]
    );

    if (updateApplicantResult.rowCount === 0) {
      throw new Error("Failed to update applicant status.");
    }

    // 5. Update payment information
    const checkPaymentQuery = `SELECT payment_status FROM payments WHERE application_id = $1`;
    const paymentCheckResult = await client.query(checkPaymentQuery, [application_id]);

    if (paymentCheckResult.rows.length > 0 && paymentCheckResult.rows[0].payment_status !== 'paid') {
      const updatePaymentResult = await client.query(
        `
          UPDATE payments
          SET
            amount = $1,
            payment_status = 'paid',
            payment_method = 'cash',
            payment_type = $2,
            student_id = $3,
            application_id = NULL
          WHERE application_id = $4
        `,
        [feeAmount, payment_type, studentId, application_id]
      );

      if (updatePaymentResult.rowCount === 0) {
        console.log("No pending payment record found for this application to update.");
      }
    } else if (paymentCheckResult.rows.length === 0) {
      console.log("No payment record found for this application.");
      // Optionally, you might want to create a payment record here if one doesn't exist.
      // However, based on the requirement, we only update if it's pending.
    } else {
      console.log("Payment is already marked as paid.");
    }

    await client.query("COMMIT");

    transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: applicant.email,
      subject: "Application Approved For CCPUR COLLEGE",
      html: `
        <p>💥 *Listen up, future game-changer!* 💥</p>
        <p>Your application has been APPROVED. Not surprised, though – CCPUR COLLEGE doesn’t take just anyone. You’ve earned your spot, and you’re now officially enrolled in <strong>${applicant.course}</strong>. 🦾</p>
        <p>Welcome to the grind. No excuses. No limits. This is where the weak are separated from the strong, and the strong become unstoppable. 💯</p>
        <p>Sharpen your mind. Prepare for glory. It’s time to dominate. See you at the top. 🔥</p>
        <p><strong>CCPUR COLLEGE: Where Alphas Rise. 🐺</strong></p>
      `,
    });

    res.status(200).json({
      message: "Application approved",
      student: studentData,
    });
  } catch (error) {
    await client.query("ROLLBACK"); // Rollback transaction on failure
    console.error("Error approving applicant:", error.message);
    res.status(500).json({ error: error.message });
  } finally {
    client.release(); // Release the client back to the pool
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
  getRejectedApplications,
  approveApplicant,
  rejectApplication,
  getSingleApps,
  getSingleApplication,
  getApprovedApplications,
  approveYearlyApplication,
};
