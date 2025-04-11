const jwt = require("jsonwebtoken");
const pool = require("../config/db"); // Ensure this points to the correct DB config
require("dotenv").config();

// Middleware to authenticate users dynamically
const authenticateUser = async (req, res, next) => {
  try {
      const token = req.headers['authorization'] || req.headers['Authorization'];

      if (!token || !token.startsWith("Bearer ")) {
          return res.status(401).json({ error: "Access denied. No token provided." });
      }

      const decoded = jwt.verify(token.split(" ")[1], process.env.JWT_SECRET);

      // Check if the user exists in the users table using email instead of id
      const userResult = await pool.query("SELECT user_id, role FROM users WHERE email = $1", [decoded.email]);
      if (userResult.rows.length === 0) {
          return res.status(403).json({ error: "User not found." });
      }

      const user = userResult.rows[0];

      // Attach user details to request
      req.user = { id: user.user_id, role: user.role, email: decoded.email };
      next();
  } catch (error) {
      console.error("JWT Error:", error);
      res.status(401).json({ error: "Invalid or expired token." });
  }
};


// Self authorization(can only view their own files and details
const authorizeSelfAccess = async (req, res, next) => {
  try {
    // Extract and verify token
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "Authorization token is missing" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded.user_id) {
      return res.status(400).json({ error: "Invalid token: User ID missing" });
    }

    // Attach user details to the request
    req.user = { id: decoded.user_id, role: decoded.role };

    // Retrieve IDs from the request body or query
    const userIdFromRequest = req.body.user_id || req.query.user_id || decoded.user_id;
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
      const result = await db.query(query, [facultyIdFromRequest]);

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
        console.log("Decoded User:", req.user); // Debug
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized: No user found" });
        }
        console.log("Allowed Roles:", roles, "User Role:", req.user.role); // Debug
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: "Forbidden: You do not have permission." });
        }
        next();
    };
};

module.exports = { authenticateUser, authorizeRoles, authorizeSelfAccess };