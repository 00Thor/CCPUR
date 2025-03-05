const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const router = require("./routes/mainRouter");
const http = require("http");
const { setupWebSocket } = require("./controller/websocket");
require("dotenv").config();
const path = require("path");


const app = express();
const server = http.createServer(app);

// Set PORT with fallback
const port = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Body parsers for API routes
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

// Set up WebSocket server
setupWebSocket(server);

// Handle unknown routes
app.all("*", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// General Error Handler
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({ error: "Internal Server Error" });
});

// Increase max listeners for events
require("events").EventEmitter.defaultMaxListeners = 20;

// Start Server
server.listen(port, "0.0.0.0", () => {
  console.log(`Server is running on port ${port}`);
});
