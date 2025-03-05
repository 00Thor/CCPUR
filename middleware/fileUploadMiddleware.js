const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Helper to ensure directories exist
const ensureDirectoryExists = (dirPath) => {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  } catch (err) {
    console.error(`Failed to create directory ${dirPath}:`, err);
    throw new Error(`Directory creation error for ${dirPath}`);
  }
};

// Directories
const uploadDir = path.resolve("./uploads");
const facultyPhotoDir = path.resolve("./uploads/facultyPhoto");

// Ensure required directories exist
ensureDirectoryExists(uploadDir);
ensureDirectoryExists(facultyPhotoDir);

// Common file filter for allowed MIME types
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ["image/jpeg", "image/png", "application/pdf"];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only JPEG, PNG, and PDF files are allowed."));
  }
};

// Helper to generate unique file names
const generateFileName = (file) => {
  return `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`;
};

// Storage configuration for student uploads
const studentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); // Store files directly in the uploads directory
  },
  filename: (req, file, cb) => {
    cb(null, generateFileName(file)); // Generate unique filenames
  },
});

const studentFileUploadMiddleware = multer({
  storage: studentStorage,
  limits: { fileSize: 1 * 1024 * 1024 }, // Limit file size to 1 MB
  fileFilter,
}).fields([
  { name: "passport", maxCount: 1 },
  { name: "signature", maxCount: 1 },
  { name: "xmarksheet", maxCount: 1 },
  { name: "xadmitcard", maxCount: 1 },
  { name: "xiiadmitcard", maxCount: 1 },
  { name: "xiimarksheet", maxCount: 1 },
  { name: "migration", maxCount: 1 },
  { name: "tribe", maxCount: 1 },
]);

// Faculty storage configuration
const facultyStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, facultyPhotoDir); // Store faculty photos in their specific folder
  },
  filename: (req, file, cb) => {
    cb(null, generateFileName(file)); // Generate unique filenames
  },
});

const uploadFacultyPhotoMiddleware = multer({
  storage: facultyStorage,
  limits: { fileSize: 1 * 1024 * 1024 }, // Limit file size to 1 MB
  fileFilter,
}).single("faculty_picture");

// Middleware to handle file filter errors gracefully
const handleFileErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: `Multer error: ${err.message}` });
  }
  if (err.message === "Invalid file type. Only JPEG, PNG, and PDF files are allowed.") {
    return res.status(400).json({ error: err.message });
  }
  next(err); // Pass other errors to the default error handler
};

module.exports = { 
  studentFileUploadMiddleware, 
  uploadFacultyPhotoMiddleware, 
  handleFileErrors 
};
