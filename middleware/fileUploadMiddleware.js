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
const tempDir = path.resolve("./temp"); // Temporary storage directory
const uploadDir = path.resolve("./uploads");
const facultyPhotoDir = path.resolve("./uploads/facultyPhoto");

// Ensure required directories exist
ensureDirectoryExists(tempDir);
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

// Cleanup function to delete temporary files
const cleanupTempFiles = (files) => {
  if (!files || typeof files !== "object") {
    return;
  }

  try {
    Object.keys(files).forEach((field) => {
      files[field].forEach((file) => {
        const tempPath = file.path;
        if (fs.existsSync(tempPath)) {
          fs.unlinkSync(tempPath);
        }
      });
    });
  } catch (err) {
    // Do nothing, as cleanup failures shouldn't block other operations.
  }
};


// Temporary storage configuration for student uploads
const studentTempStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempDir); // Store files in the temporary directory
  },
  filename: (req, file, cb) => {
    cb(null, generateFileName(file)); // Generate unique filenames
  },
});

const studentFileUploadMiddleware = multer({
  storage: studentTempStorage,
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

// Faculty Multer configuration
const facultyTempStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempDir); // Store files temporarily
  },
  filename: (req, file, cb) => {
    cb(null, generateFileName(file)); // Generate unique filenames
  },
});

const uploadFacultyPhotoMiddleware = multer({
  storage: facultyTempStorage,
  limits: { fileSize: 1 * 1024 * 1024 }, // Limit file size to 1 MB
  fileFilter,
}).single("faculty_picture");


// Helper to move files from temporary to final directory
const finalizeUploads = (files, targetDir) => {
  if (!files || typeof files !== "object") {
    return {};
  }

  const finalizedPaths = {};

  try {
    Object.keys(files).forEach((field) => {
      finalizedPaths[field] = [];
      files[field].forEach((file) => {
        const tempPath = file.path;
        const finalPath = path.join(targetDir, file.filename);

        if (fs.existsSync(tempPath)) {
          fs.renameSync(tempPath, finalPath);
          finalizedPaths[field].push(finalPath);
        }
      });
    });

    return finalizedPaths;
  } catch (err) {
    throw new Error("Failed to finalize file uploads.");
  }
};


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
  handleFileErrors, 
  cleanupTempFiles, 
  finalizeUploads 
};
