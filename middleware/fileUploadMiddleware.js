const multer = require("multer");
const sharp = require("sharp");
const { BlobServiceClient } = require("@azure/storage-blob");


// Azure Blob Storage configuration
const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING);
const studentContainerName = "student-files";
const facultyContainerName = "faculty-files";
const studentContainerClient = blobServiceClient.getContainerClient(studentContainerName);
const facultyContainerClient = blobServiceClient.getContainerClient(facultyContainerName);

// Ensure Azure containers exist
const ensureContainerExists = async (containerClient) => {
  try {
    const exists = await containerClient.exists();
    if (!exists) {
      await containerClient.create();
    }
  } catch (err) {
    console.error("Failed to ensure container existence:", err);
    throw new Error("Azure Blob Storage configuration error.");
  }
};

ensureContainerExists(studentContainerClient);
ensureContainerExists(facultyContainerClient);

const fileFilter = (req, file, cb) => {
  console.log("Uploaded file details:", { mimetype: file.mimetype, originalname: file.originalname });
  const allowedImageTypes = ["image/jpeg", "image/png", "image/jpg"];
  const isImage = allowedImageTypes.includes(file.mimetype);
  const isPDF = file.mimetype === "application/pdf";

  if (isImage || isPDF) {
    console.log("File accepted:", file.originalname);
    cb(null, true); // Accept the file
  } else {
    console.error("File rejected:", file.originalname, "| MIME type:", file.mimetype);
    cb(new Error("Invalid file type. Only JPEG, PNG, JPG, and PDF files are allowed."));
  }
};

// Helper to compress images before upload
const compressImageBuffer = async (buffer, mimeType) => {
  if (mimeType.startsWith("image/")) {
    return await sharp(buffer)
      .resize({ width: 800 })
      .jpeg({ quality: 80 })
      .toBuffer();
  }
  return buffer;
};

// Middleware for student file uploads + compression
const studentFileUploadMiddleware = async (req, res, next) => {
  // Multer setup
  const multerMiddleware = multer({
    storage: multer.memoryStorage(), // Store files in memory
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
    fileFilter, // Use the file filter to validate file types
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

  // Execute Multer middleware
  multerMiddleware(req, res, async (err) => {
    if (err) return next(err); // Pass Multer errors to error handler

    try {
      if (!req.files || Object.keys(req.files).length === 0) return next();

      const compressTasks = [];

      // Iterate over all uploaded files
      Object.keys(req.files).forEach((fieldName) => {
        req.files[fieldName].forEach((file) => {
          if (file.mimetype.startsWith("image/")) {
            compressTasks.push(
              compressImageBuffer(file.buffer, file.mimetype).then((compressedBuffer) => {
                file.buffer = compressedBuffer; // Replace the original buffer with the compressed buffer
                file.compressedPath = `${Date.now()}-${file.originalname}-compressed.jpg`;
              })
            );
          } else {
            file.compressedPath = null; // No compression for non-image files
          }
        });
      });

      await Promise.all(compressTasks);
      console.log("Image compression completed successfully.");
      next();
    } catch (error) {
      console.error("Error compressing uploaded images:", error.message);
      next(new Error("Image compression failed."));
    }
  });
};


const studentFileUpdateMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, 
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ["image/jpeg", "image/png", "application/pdf"];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only JPEG, PNG, and PDF files are allowed."));
    }
  },
}).single("file");



// Middleware for faculty photo uploads + handel compression
const uploadFacultyFilesMiddleware = async (req, res, next) => {
  const multerMiddleware = multer({
    storage: multer.memoryStorage(), 
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter,
  }).fields([
    { name: "profile_photos", maxCount: 1 },
    { name: "books_published_images", maxCount: 5 },
    { name: "books_published_pdfs", maxCount: 5 },
    { name: "seminars_attended_images", maxCount: 5 },
    { name: "seminars_attended_pdfs", maxCount: 5 },
  ]);

  // Execute Multer middleware
  multerMiddleware(req, res, async (err) => {
    if (err) return next(err); // Pass Multer errors to error handler

    try {
      if (!req.files || Object.keys(req.files).length === 0) return next();

      const compressTasks = [];

      // Iterate over all uploaded files
      Object.keys(req.files).forEach((fieldName) => {
        req.files[fieldName].forEach((file) => {
          if (file.mimetype.startsWith("image/")) {
            compressTasks.push(
              compressImageBuffer(file.buffer, file.mimetype).then((compressedBuffer) => {
                file.buffer = compressedBuffer;
                file.compressedPath = `${Date.now()}-${file.originalname}-compressed.jpg`;
              })
            );
          } else {
            file.compressedPath = null; // No compression for non-image files
          }
        });
      });

      await Promise.all(compressTasks);
      console.log("Image compression completed successfully.");
      next();
    } catch (error) {
      console.error("Error compressing uploaded images:", error.message);
      next(new Error("Image compression failed."));
    }
  });
};


// Middleware to handle file filter errors gracefully
const handleFileErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.error("Multer error:", err.message);
    return res.status(400).json({ error: `Multer error: ${err.message}` });
  }

  if (err.message === "Invalid file type. Only JPEG, PNG, JPG, and PDF files are allowed.") {
    console.error("File type error:", err.message);
    return res.status(400).json({ error: err.message });
  }

  if (err.message.includes("Image compression failed")) {
    console.error("Compression error:", err.message);
    return res.status(500).json({ error: "Image compression failed." });
  }

  // Handle generic errors
  console.error("Unhandled error in handleFileErrors:", err.message);
  res.status(500).json({ error: "An unexpected error occurred." });
};

// Middleware to handle image compression
const compressUploadedImages = async (req, res, next) => {
  try {
    if (!req.files || Object.keys(req.files).length === 0) return next();

    const compressTasks = [];

    Object.keys(req.files).forEach((fieldName) => {
      req.files[fieldName].forEach((file) => {
        // Only compress image files
        if (file.mimetype.startsWith("image/")) {
          const compressedPath = `${Date.now()}-${file.originalname}-compressed.jpg`;
          compressTasks.push(
            compressImageBuffer(file.buffer, file.mimetype).then((compressedBuffer) => {
              file.compressedBuffer = compressedBuffer; r
              file.compressedPath = compressedPath;
            })
          );
        } else {
        
          file.compressedPath = null; 
        }
      });
    });

    await Promise.all(compressTasks);
    console.log("Image compression completed successfully.");
    next();
  } catch (error) {
    console.error("Error compressing uploaded images:", error.message);
    res.status(500).json({ error: "Image compression failed." });
  }
};

module.exports = {
  studentFileUploadMiddleware,
  uploadFacultyFilesMiddleware,
  handleFileErrors,
  compressUploadedImages,
  studentFileUpdateMiddleware,
};
