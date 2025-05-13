const jwt = require("jsonwebtoken");
const pool = require("../config/db");
const cookieParser = require("cookie-parser"); 


const authenticateUser = async (req, res, next) => {
  try {

    //const token = req.cookies.authToken;
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Access denied. No token provided." });
    }
    const token = authHeader.split(" ")[1];
    console.log("Extracted Token:", token);

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Query user table
    const userQuery = `
      SELECT user_id, role 
      FROM users 
      WHERE email = $1
      UNION ALL
      SELECT faculty_id AS user_id, role 
      FROM faculty 
      WHERE email = $1
    `;
    const result = await pool.query(userQuery, [decoded.email]);

    if (result.rows.length === 0) {
      return res.status(403).json({ error: "User not found." });
    }

    // Attach user details to request
    const user = result.rows[0];
    req.user = { id: user.user_id, role: user.role, email: decoded.email };

    next(); // Proceed to the next middleware
  } catch (error) {
    console.error("JWT Error:", error.message);
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