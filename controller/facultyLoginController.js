const { findFacultyByEmail, createFaculty, updateFacultyPassword } = require("../models/facultyModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
require("dotenv").config();

// Register a new faculty member
const newFaculty = async (req, res) => {
  try {
    const { name, email, password, department, designation, nature_of_appointment, type, phone_number, profile_picture} = req.body;

    // Validate required fields
    if (!name || !email || !password || !department || !designation  || !nature_of_appointment || !type || !phone_number || !profile_picture) {
      return res.status(400).json({ message: "Please provide all required details" });
    }

    // Check if faculty already exists
    const facultyExists = await findFacultyByEmail(email);
    if (facultyExists) {
      return res.status(400).json({ message: "Faculty with this email already exists" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new faculty into the database
    const newFaculty = await createFaculty(name, email, hashedPassword, department, designation, nature_of_appointment, type, phone_number, profile_picture);
    if (!newFaculty) {
      return res.status(500).json({ message: "Error creating faculty" });
    }
    return res.status(201).json({
      message: "Faculty registered successfully",
      faculty: {
        id: newFaculty.id,
        name: newFaculty.name,
        email: newFaculty.email,
        department: newFaculty.department,
        designation: newFaculty.designation,
        nature_of_appointment: newFaculty.nature_of_appointment,
        type: newFaculty.type,
        phone_number: newFaculty.phone_number,
        profile_picture: newFaculty.profile_picture

      },
    });
  } catch (error) {
    console.error("Error in faculty registration:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// Faculty login function
const facultyLogin = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const faculty = await findFacultyByEmail(email);
    if (!faculty) {
      return res.status(400).json({ error: "Faculty not found" });
    }

    const validPassword = await bcrypt.compare(password, faculty.password);
    if (!validPassword) {
      return res.status(401).json({ error: "Invalid password" });
    }

    // Generate JWT with faculty role
    const token = jwt.sign(
      { id: faculty.id, email: faculty.email, role: "faculty" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      message: "Login successful",
      token
    });
  } catch (error) {
    console.error("Error in login:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

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

module.exports = {
  newFaculty,
  facultyLogin,
  forgotFacultyPassword,
  resetFacultyPassword
};
