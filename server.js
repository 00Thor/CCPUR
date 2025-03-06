const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const router = require("./routes/mainRouter");
const http = require("http");
const { setupWebSocket } = require("./controller/websocket");
require("dotenv").config();
const path = require("path");

// Create Express app and HTTP server
const app = express();
const server = http.createServer(app);

// Set PORT with fallback
const port = process.env.PORT || 3000;

// Security middleware: Helmet
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow images from other origins
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", "data:", process.env.BACKEND_URL || "http://192.168.1.11:5000"], // Dynamic backend URL
      },
    },
  })
);

// CORS setup: Adjust for production
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(",") : "*",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    allowedHeaders: "Content-Type,Authorization",
    credentials: true,
  })
);

// Static file handling with caching
app.use("/uploads", express.static(path.join(__dirname, "uploads"), { maxAge: "1d" }));

// Body parsers for JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware (optional: Use in development)
if (process.env.NODE_ENV === "development") {
  const morgan = require("morgan");
  app.use(morgan("dev"));
}

// Rate limiter: Protect API routes
const rateLimit = require("express-rate-limit");
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: "Too many requests, please try again later.",
});
app.use("/api/", limiter);

// API Routes
app.use("/api", router);

// WebSocket setup
setupWebSocket(server);

// Handle unknown routes
app.all("*", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Global Error Handler
app.use((err, req, res, next) => {
  const message = process.env.NODE_ENV === "production" ? "Internal Server Error" : err.message;
  console.error("Error:", err);
  res.status(500).json({ error: message });
});

// Increase max listeners for events (optional)
require("events").EventEmitter.defaultMaxListeners = 20;

// Start server
server.listen(port, "0.0.0.0", () => {
  console.log(`Server is running on http://localhost:${port}`);
});
