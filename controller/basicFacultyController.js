const { findFacultyByEmail, createFaculty, updateFacultyPassword,
  teachingStaff, nonTeachingStaff,
  deleteFacultyDetails, getFacultyById,
  updateStaffById} = require("../models/basicFacultyModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require('../config/db');
const nodemailer = require("nodemailer");
require("dotenv").config();

// Faculty login function(both admin & faculty)
const facultyLogin = async (req, res) => {
//   const { email, password } = req.body;

//   if (!email || !password) {
//     return res.status(400).json({ error: "Email and password are required" });
//   }

//   try {
//     const faculty = await findFacultyByEmail(email);
//     if (!faculty) {
//       return res.status(400).json({ error: "Faculty not found" });
//     }

//     const validPassword = await bcrypt.compare(password, faculty.password);
//     if (!validPassword) {
//       return res.status(401).json({ error: "Invalid password" });
//     }

//     const token = jwt.sign(
//       { id: faculty.id, email: faculty.email, role: faculty.role },
//       process.env.JWT_SECRET,
//       { expiresIn: "1m" }
//     );

//     res.cookie("authToken", token, {
//       httpOnly: true,
//       secure: true, 
//       sameSite: "None",
//       maxAge: 5 * 60 * 60 * 1000,
//     });

//     res.json({
//       message: "Login successful",
//       token,
//       faculty_id: faculty.faculty_id,
//     });
//   } catch (error) {
//     console.error("Error in login:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// };
  try {
    const { name, password } = req.body;

    // Validate request body
    if (!name || !password) {
      return res.status(400).json({ error: "Name and password are required." });
    }

    // Query the database for the admin's credentials
    const query = "SELECT name, password, role FROM users WHERE name = $1 AND role = $2";
    const result = await pool.query(query, [name, "admin"]);

    // Check if the admin exists
    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid name or password." });
    }

    const admin = result.rows[0];

    // Validate the password using bcrypt
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid name or password." });
    }

    // Generate a JWT for the admin
    const token = jwt.sign(
      { name: admin.name, role: admin.role }, // Payload
      process.env.JWT_SECRET, // Secret key
      { expiresIn: "6h" } // Expiration time
    );

    // Respond with the token
    res.status(200).json({ message: "Login successful.", token });
  } catch (error) {
    console.error("Error in loginAdmin:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Creating a new Faculty
const newFaculty = async (client, personalData) => {
  let localClient = client;
  let transactionStarted = false;

  try {
    // Use an existing client or create a new one
    if (!client) {
      localClient = await pool.connect();
      transactionStarted = true; // Track if we started the transaction
    }

    // Begin transaction if this function is managing it
    if (transactionStarted) {
      await localClient.query("BEGIN");
    }

    // Destructure faculty data
    const {
      name,
      email,
      address,
      contact_number,
      date_of_birth,
      gender,
      designation,
      type,
      joining_date,
      teaching_experience,
      engagement,
      category,
      academic_qualifications,
      department_id,
      password,
    } = personalData;

    // Validate required fields
    const missingFields = [];
    const requiredFields = {
      name,
      email,
      address,
      contact_number,
      date_of_birth,
      gender,
      designation,
      type,
      joining_date,
      teaching_experience,
      engagement,
      category,
      academic_qualifications,
      department_id,
      password,
    };

    for (const [field, value] of Object.entries(requiredFields)) {
      if (!value) missingFields.push(field);
    }

    if (missingFields.length > 0) {
      throw new Error(
        `Missing required faculty details: ${missingFields.join(", ")}`
      );
    }

    // Check if faculty already exists
    const facultyExists = await findFacultyByEmail(email);
    if (facultyExists) {
      throw new Error("Faculty with this email already exists.");
    }

    // Hash the password securely
    const hashedPassword = await bcrypt.hash(password, 10);

    // Call the model to insert faculty data
    const createdFaculty = await createFaculty(localClient, {
      name,
      email,
      hashedPassword,
      designation,
      type,
      engagement,
      contact_number,
      joining_date,
      teaching_experience,
      address,
      date_of_birth,
      gender,
      category,
      academic_qualifications,
      department_id,
    });

    // Commit transaction if started here
    if (transactionStarted) {
      await localClient.query("COMMIT");
    }

    // Return the created faculty object
    return createdFaculty;
  } catch (error) {
    // Rollback transaction if started here
    if (transactionStarted) {
      await localClient.query("ROLLBACK");
    }
    console.error("Error in faculty registration:", error.message);

    // Handle specific errors
    if (error.code === "23505") {
      throw new Error("Duplicate entry: Faculty email must be unique.");
    }

    throw error;
  } finally {
    // Release the client only if it was created in this function
    if (!client && localClient) {
      localClient.release();
    }
  }
};



// Configure the transporter
const transporter = nodemailer.createTransport({
  service: "gmail", // Change this if using another service
  auth: {
    user: process.env.EMAIL_USER, // Your email address
    pass: process.env.EMAIL_PASS, // App password (not your regular password)
  },
});

// Forgot password function
const forgotFacultyPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const faculty = await findFacultyByEmail(email);
    if (!faculty) {
      return res.status(404).json({ error: "Faculty does not exist" });
    }

    const resetToken = jwt.sign(
      { email: faculty.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    const resetLink = `${process.env.FRONTEND_URL}/resetpassword/${resetToken}`;

    await transporter.sendMail({
      from: `Support <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Password Reset Request",
      html: `<p>Click <a href="${resetLink}">here</a> to reset your password.</p>`,
    });

    res.json({ message: "Password reset link sent to your email." });
  } catch (error) {
    console.error("Error in forgot password:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Reset password function
const resetFacultyPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await updateFacultyPassword(decoded.email, hashedPassword);

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Error in reset password:", error);

    if (error.name === "TokenExpiredError") {
      return res.status(400).json({ error: "Token has expired. Request a new one." });
    } else if (error.name === "JsonWebTokenError") {
      return res.status(400).json({ error: "Invalid token." });
    }

    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Fetch Teaching Staff
const getTeachingStaff = async (req, res) => {
    try {
        const staffList = await teachingStaff();
        if (!staffList || staffList.length === 0) {
            return res.status(404).json({ message: "No teaching staff found" });
        }
        return res.status(200).json({ success: true, data: staffList });
    } catch (error) {
        console.error('Error fetching teaching staff:', error.message);
        return res.status(500).json({ success: false, message: 'An error occurred while fetching teaching staff' });
    }
};

// Fetch Non-Teaching Staff
const getNonTeachingStaff = async (req, res) => {
    try {
        const staffList = await nonTeachingStaff();
        if (!staffList || staffList.length === 0) {
            return res.status(404).json({ message: "No non-teaching staff found" });
        }
        return res.status(200).json({ success: true, data: staffList });
    } catch (error) {
        console.error('Error fetching non-teaching staff:', error.message);
        return res.status(500).json({ success: false, message: 'An error occurred while fetching non-teaching staff' });
    }
};


// faculty dashboard for faculty to view their profile and more
const retrieveSpecificFacultyById = async (req, res) => {
  try {
      const { faculty_id } = req.params;

      if (!faculty_id) {
          return res.status(400).json({ success: false, message: "Faculty ID is required" });
      }

      // Fetch faculty details from the database
      const facultyDetails = await getFacultyById(faculty_id);

      // Debugging: Log the retrieved faculty details
      console.log("Faculty details retrieved:", facultyDetails);

      // Handle cases where no faculty is found
      if (!facultyDetails) {
          return res.status(404).json({ success: false, message: "Faculty profile not found" });
      }

      // Send the response
      res.status(200).json({
          success: true,
          profile: facultyDetails, // Return the faculty details directly
      });
  } catch (error) {
      console.error("Error fetching faculty dashboard:", error.message);
      res.status(500).json({ success: false, message: "An error occurred while fetching faculty dashboard" });
  }
};

// Delete staff 
const deleteFaculty = async (req, res) => {
    try {
        const { identifier } = req.params; // Identifier could be roll_no or aadhaar_no

        const deletedstaff = await deleteFacultyDetails(identifier);

        if (!deletedstaff) {
            return res.status(404).json({ success: false, message: 'Faculty details not found' });
        }

        res.json({ success: true, message: 'Faculty deleted successfully', deletedstaff });
    } catch (error) {
        console.error("Error deleting staff:", error.message);
        res.status(500).json({ success: false, message: 'An error occurred while deleting the staff details' });
    }
};

// Filter Faculty Dashboard
const filterFacultyDashboard = async (req, res) => {
  try {
    const { department } = req.body;

    // Validate input
    if (!department) {
      return res.status(400).json({
        success: false,
        message: "No department provided for filtering",
      });
    }

    // SQL Query to filter by department name
    const query = `
      SELECT 
        fc.name,
        fc.contact_number,
        dp.department_name
      FROM faculty fc
      INNER JOIN department dp
        ON fc.department_id = dp.department_id
      WHERE dp.department_name = $1
    `;

    // Query execution
    const results = await pool.query(query, [department]);

    // Check if no results
    if (results.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No faculty found for the given department",
      });
    }

    // Send the results
    res.status(200).json({
      success: true,
      data: results.rows,
    });

  } catch (error) {
    console.error("Error during filter search:", error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error during filter search",
    });
  }
};

// Update Staff Details (Dynamic Update)
const updateFacultyPersonalDetails = async (req, res) => {
  try {
      const { faculty_id } = req.params; // Identifier could be roll_no or aadhaar_no
      const updatedFields = req.body;

      const updatedstaff = await updateStaffById(faculty_id, updatedFields);

      if (!updatedstaff) {
          return res.status(404).json({ success: false, message: 'Faculty member not found' });
      }

      res.json({ success: true, message: 'Faculty detail updated successfully', updatedstaff });
  } catch (error) {
      console.error("Error updating faculty:", error.message);
      res.status(500).json({ success: false, message: 'An error occurred while updating the staff details' });
  }
};

// Get all faculty/staff details
const getAllFaculty = async (req, res) => {
  try {
      // Query to fetch all records
      const query = `SELECT 
                      fc.faculty_id,
                      fc.name,
                      fc.gender,
                      fc.type,
                      fc.designation,
                      fc.engagement,
                      fc.contact_number,
                      dp.department_name
                      FROM faculty fc
                      INNER JOIN department dp
                      ON fc.department_id=dp.department_id
                      `;
      const result = await pool.query(query);
      if(result.rows.length === 0){
        return res.status(400).json({success: false, message: "No record found"});
      }
      return res.status(200).json({
        success: true,
        data: result.rows
      })
  } catch (error) {
      console.error("Error fetching staff details:", error.message);
      res.status(500).json({ error: error.message });
  }
};
module.exports = { 
    getTeachingStaff, 
    getNonTeachingStaff,  
    retrieveSpecificFacultyById,
    deleteFaculty,
    newFaculty,
    facultyLogin,
    forgotFacultyPassword,
    resetFacultyPassword,
    updateFacultyPersonalDetails,
    getAllFaculty,
    filterFacultyDashboard
};
