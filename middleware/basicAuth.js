const jwt = require("jsonwebtoken");
const pool = require("../config/db");
const cookieParser = require("cookie-parser"); 

require("dotenv").config();
const authenticateUser = async (req, res, next) => {
  try {
    // Debugging: Check incoming cookies
    console.log("All cookies received:", req.cookies);

    // Extract token from cookies
    const token = req.cookies.authToken;
    console.log("Extracted token:", token);

    if (!token) {
      return res.status(401).json({ error: "Access denied. No token provided." });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const userResult = await pool.query("SELECT user_id, role FROM users WHERE email = $1", [decoded.email]);

    if (userResult.rows.length === 0) {
      return res.status(403).json({ error: "User not found." });
    }

    const user = userResult.rows[0];

    // Attach user details to request
    req.user = { id: user.user_id, role: user.role, email: decoded.email };
    console.log("Authenticated user:", req.user);

    next();
  } catch (error) {
    console.error("JWT Error:", error);
    res.status(401).json({ error: "Invalid or expired token." });
  }
};


const authorizeSelfAccess = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Authorization token is missing or invalid" });
    }

    const userIdFromRequest = req.body.user_id || req.query.user_id || req.user.id;
    const facultyIdFromRequest = req.body.faculty_id || req.query.faculty_id;

    // Role-specific access control
    if (req.user.role === "student" && req.user.id !== userIdFromRequest) {
      return res.status(403).json({ error: "Access denied: Unauthorized student" });
    }

    if (req.user.role === "staff") {
      if (!facultyIdFromRequest) {
        return res.status(400).json({ error: "Faculty ID is required for staff access" });
      }

      const query = "SELECT faculty_id FROM faculty WHERE faculty_id = $1";
      const result = await pool.query(query, [facultyIdFromRequest]);

      if (result.rowCount === 0 || req.user.id !== facultyIdFromRequest) {
        return res.status(403).json({ error: "Access denied: Faculty ID not found or unauthorized" });
      }
    }

    // Admins can access any resource
    if (req.user.role === "admin") {
      return next();
    }

    // Proceed for valid access
    next();
  } catch (error) {
    console.error("Error in authorizeSelfAccess middleware:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

  
// Role-Based Authorization Middleware
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized: No user found" });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: "Forbidden: You do not have permission." });
        }
        next();
    };
};

module.exports = { authenticateUser, authorizeRoles, authorizeSelfAccess };