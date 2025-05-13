const multer = require("multer");
const sharp = require("sharp");

// File filter for PDF files
const uploadPdf = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true); // Accept PDFs
    } else {
      cb(new Error("Only PDF files are allowed"), false);
    }
  },
  limits: { fileSize: 15 * 1024 * 1024 }, 
});

// File filter for general files (images, PDFs, text files, etc.)
const generalFileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "application/pdf",
    "text/plain",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true); // Accept file
  } else {
    cb(new Error("Invalid file type"), false); // Reject file
  }
};

// Multer configuration for memory storage (used for Azure uploads)
const storage = multer.memoryStorage();

// Sharp image processing function
const processImage = async (buffer, mimetype) => {
  try {
    if (mimetype === "image/jpeg" || mimetype === "image/png") {
      return sharp(buffer)
        .resize(800) // Resize to 800px width
        .toBuffer(); // Convert image to buffer
    }
    return buffer; // If not an image, just return the original buffer
  } catch (error) {
    throw new Error("Error processing image: " + error.message);
  }
};

// File compression logic for images using Sharp
const compressImage = async (buffer, mimetype) => {
  try {
    if (mimetype === "image/jpeg" || mimetype === "image/png") {
      return sharp(buffer)
        .resize(800) // Resize image (optional)
        .jpeg({ quality: 80 }) // If JPEG, compress with quality 80
        .png({ quality: 80 }) // If PNG, compress with quality 80
        .toBuffer();
    }
    return buffer; // If not an image, return the original buffer
  } catch (error) {
    throw new Error("Error compressing image: " + error.message);
  }
};

// Configure multer for general files
const uploadGeneral = multer({
  storage,
  fileFilter: generalFileFilter,
  limits: { fileSize: 3 * 1024 * 1024 }, 
}).any();

// Middleware to compress images after file upload (for multiple files)
const compressUploadedFiles = async (req, res, next) => {
  try {
     // Check if req.files is defined and is an array
     if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({ error: "No files uploaded." });
    }
    // Process each uploaded file
    for (let file of req.files) {
      if (file.mimetype.startsWith("image")) {
        const compressedBuffer = await compressImage(
          file.buffer,
          file.mimetype
        );
        file.buffer = compressedBuffer; // Replace original buffer with the compressed buffer
      }
    }
    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    return res.status(400).send({ error: error.message });
  }
};

module.exports = {
  uploadPdf,
  uploadGeneral,
  compressUploadedFiles,
  compressImage, 
};
