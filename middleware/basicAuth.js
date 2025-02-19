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
        console.log("Decoded Token:", decoded); // Debugging log

        // Check if the user exists in the users table using email instead of id
        const userResult = await pool.query("SELECT user_id, role FROM users WHERE email = $1", [decoded.email]);
        if (userResult.rows.length === 0) {
            return res.status(403).json({ error: "User not found." });
        }

        const user = userResult.rows[0];

        // Attach user details to request
        req.user = { id: user.user_id, role: user.role };
        next();
    } catch (error) {
        console.error("JWT Error:", error);
        res.status(401).json({ error: "Invalid or expired token." });
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

module.exports = { authenticateUser, authorizeRoles };
