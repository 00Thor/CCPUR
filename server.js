const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const router = require("./router/route");
require("dotenv").config();

const app = express();

// Set PORT with fallback
const port = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors());
/* CORS Configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions)); */

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiter (optional, uncomment if needed)
/*
const rateLimit = require("express-rate-limit");
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: "Too many requests, please try again later.",
});
app.use("/api/", limiter);
*/

// Routes
app.use("/api", router);

// Handle unknown routes
app.all("*", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// General Error Handler
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({ error: "Internal Server Error" });
});

// Start Server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
