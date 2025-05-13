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
const allowedOrigins = process.env.ALLOWED_ORIGINS;

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // Allow non-origin requests (e.g., from Postman)
    if (allowedOrigins === "*" || allowedOrigins.split(',').includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error("Not allowed by CORS"));
    }
  },
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  allowedHeaders: "Content-Type,Authorization",
  credentials: false,
};

app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options("*", cors(corsOptions));

// Body parsers for JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging in development mode
if (process.env.NODE_ENV === "development") {
  const morgan = require("morgan");
  app.use(morgan("dev"));
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