const { createUser, findUserByEmail, updateUserPassword } = require("../models/basicUserModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const pool = require("../config/db");
require("dotenv").config();

// Register a new user
const newUser = async (req, res) => {
  try {
    const { name, email, password, program } = req.body;

    // Validate required fields
    if (!name || !email || !password || !program) {
      return res.status(400).json({ message: "Please provide all required details" });
    }

    // Check if user already exists
    const userExists = await findUserByEmail(email);
    if (userExists) {
      return res.status(400).json({ message: "User with this email already exists" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Default role assignment: All new users are students
    const assignedRole = "student";

    // Insert new user into the database
    const newUser = await createUser(name, email, hashedPassword, assignedRole, program);
    if (!newUser) {
      return res.status(500).json({ message: "Error creating user" });
    }
    console.log("User registered successfully:", newUser);

    return res.status(201).json({
      message: "User registered successfully",
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: assignedRole,
        program: newUser.program,
      },
    });
  } catch (error) {
    console.error("Error in user registration:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// Login a user
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: "Invalid password" });
    }

    // Generate JWT with user role
    const token = jwt.sign(
      { user_id: user.user_id, email: user.email, role: user.role, program: user.program },
      process.env.JWT_SECRET,
      { expiresIn: "10h" }
    );
   res.json({
       message: "Login successful",
       token,
       userID : user._id
     });
  } catch (error) {
    console.error("Error in login:", error);
    res.status(500).json({ error: "Internal Server Error" });
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
const forgotpassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Check if user exists
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(404).json({ error: "User does not exist" });
    }

    // Generate reset token (expires in 1 hour)
    const resetToken = jwt.sign(
      { email: user.email },  
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Send email with reset link
    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    
    // Send email using Nodemailer
    await transporter.sendMail({
      from: `"FrameImpacts@Support" <${process.env.EMAIL_USER}>`, // Sender name & email
      to: email,
      subject: "Password Reset Request",
      html: `<p>Click <a href="${resetLink}">here</a> to reset your password.</p>`,
    });

    res.json({ message: "Password reset link sent to your email." });

  } catch (error) {
    console.error("Error in forgotpassword:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


// Reset password
const resetpassword = async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await updateUserPassword(decoded.email, hashedPassword);

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Error in resetpassword:", error);

    if (error.name === "TokenExpiredError") {
      return res.status(400).json({ error: "Token has expired. Request a new one." });
    } else if (error.name === "JsonWebTokenError") {
      return res.status(400).json({ error: "Invalid token." });
    }

    res.status(500).json({ error: "Internal Server Error" });
  }
};
const getUser = async (req, res) => {
  try {
    const { user_id } = req.params;
    // Ensure `req.user` has been set by middleware
    if (!user_id ) {
      return res.status(400).json({ error: "Invalid request. User ID is missing." });
    }


    // Query the database to find the user
    const result = await pool.query("SELECT name,program FROM users WHERE user_id = $1", [user_id]);
    console.log("Query result:", result.rows);

    // Check if user exists
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    // Extract the user's details
    const user = result.rows[0];

    // Respond with the user's details
    res.status(200).json({
      name: user.name,  
      program: user.program
    });
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};



module.exports = {
  newUser,
  login,
  resetpassword,
  forgotpassword,
  getUser,
};
