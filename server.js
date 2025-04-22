const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const router = require("./routes/mainRouter");
const http = require("http");
const cookieParser = require("cookie-parser");
require("dotenv").config();

// Initialize Express app and HTTP server
const app = express();
const server = http.createServer(app);

// Define port
const port = process.env.PORT || 5000;

// Middleware to parse cookies
app.use(cookieParser());


app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
    crossOriginResourcePolicy: false,
    strictTransportSecurity: { maxAge: 31536000, includeSubDomains: true }, 
    frameguard: { action: "deny" },
    xPoweredBy: false,
    referrerPolicy: { policy: "no-referrer" },
  })
);

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : ["https://yourfrontend.com"]; // Replace with your frontend URL

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) {
        console.log("No origin provided (e.g., Postman). Allowing request.");
        return callback(null, true);
      }
      if (allowedOrigins.includes(origin)) {
        console.log("Origin allowed:", origin);
        return callback(null, true);
      } else {
        console.error("Origin not allowed:", origin);
        return callback(new Error("Not allowed by CORS"));
      }
    },
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    allowedHeaders: "Content-Type,Authorization",
    credentials: true, // Allow cookies and credentials
  })
);

// Body parsers for JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging in development mode
if (process.env.NODE_ENV === "development") {
  const morgan = require("morgan");
  app.use(morgan("dev"));
}

// Middleware to log incoming cookies and headers for debugging
if (process.env.NODE_ENV === "development") {
  app.use((req, res, next) => {
    console.log("Cookies received on backend:", req.cookies);
    console.log("Headers received on backend:", req.headers);
    next();
  });
}

// API Routes
app.use("/api", router);

// Handle unknown routes
app.all("*", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Global Error Handler
app.use((err, req, res, next) => {
  const message =
    process.env.NODE_ENV === "production"
      ? "Internal Server Error"
      : err.message;
  console.error("Error:", err);
  res.status(500).json({ error: message });
});

// Increase default max listeners to avoid warnings
require("events").EventEmitter.defaultMaxListeners = 20;

// Start server
server.listen(port, "0.0.0.0", () => {
  console.log(`Server is running on port :${port}`);
});