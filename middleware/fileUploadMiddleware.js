const multer = require("multer");
const sharp = require("sharp");
const { v4: uuidv4 } = require("uuid");
const { BlobServiceClient } = require("@azure/storage-blob");

// Azure Blob Storage configuration
const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING);
const studentContainerName = "uploads";
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

// Common file filter for allowed MIME types
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ["image/jpeg", "image/png", "application/pdf"];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only JPEG, PNG, and PDF files are allowed."));
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

// Middleware for student file uploads
const studentFileUploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
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

  const uploadToAzureBlob = async (containerClient, file, fieldName) => {
  const blobName = `${uuidv4()}-${fieldName}-${file.originalname.replace(/\s+/g, "_")}`;
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  // Compress image if applicable
  const compressedBuffer = await compressImageBuffer(file.buffer, file.mimetype);

  await blockBlobClient.uploadData(compressedBuffer, {
    blobHTTPHeaders: { blobContentType: file.mimetype },
  });

  return blockBlobClient.url;
};

const studentFileUpdateMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ["image/jpeg", "image/png", "application/pdf"];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only JPEG, PNG, and PDF files are allowed."));
    }
  },
}).single("file");


// Middleware to handle Azure file uploads
const processStudentFiles = async (req, res, next) => {
  try {
    if (!req.files) return next();

    const fileUploadPromises = [];
    req.uploadedFiles = {};

    Object.entries(req.files).forEach(([fieldName, files]) => {
      files.forEach((file) => {
        fileUploadPromises.push(
          uploadToAzureBlob(studentContainerClient, file, fieldName).then((url) => {
            req.uploadedFiles[fieldName] = url;
          })
        );
      });
    });

    await Promise.all(fileUploadPromises);
    next();
  } catch (error) {
    console.error("Error uploading files to Azure:", error);
    res.status(500).json({ error: "File upload failed." });
  }
};

// Middleware for faculty photo uploads
const uploadFacultyFilesMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter,
}).fields([
  { name: "profile_photos", maxCount: 1 },
  { name: "books_published_images", maxCount: 5 },
  { name: "books_published_pdfs", maxCount: 5 },
  { name: "seminars_attended_images", maxCount: 5 },
  { name: "seminars_attended_pdfs", maxCount: 5 },
]);

const processFacultyFiles = async (req, res, next) => {
  try {
    if (!req.files) return next();

    const uploadedFiles = {};
    for (const [field, files] of Object.entries(req.files)) {
      uploadedFiles[field] = await Promise.all(
        files.map((file) => uploadToAzureBlob(facultyContainerClient, file, field))
      );
    }

    req.uploadedFiles = uploadedFiles;
    next();
  } catch (error) {
    console.error("Error processing uploaded files:", error);
    res.status(500).json({ error: "File upload failed." });
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
  next(err);
};


// Middleware to handle image compression
const compressUploadedImages = async (req, res, next) => {
  try {
    if (!req.files) return next();

    const compressTasks = [];

    Object.keys(req.files).forEach((fieldName) => {
      req.files[fieldName].forEach((file) => {
        // Only compress image files
        if (file.mimetype.startsWith("image/")) {
          const compressedPath = `${file.path}-compressed.jpg`;
          compressTasks.push(
            compressImage(file.path, compressedPath, file.mimetype)
          );
          file.compressedPath = compressedPath; // Store compressed path
        } else {
          // Skip compression for non-image files (e.g., PDFs)
          file.compressedPath = file.path;
        }
      });
    });

    await Promise.all(compressTasks);
    next();
  } catch (error) {
    console.error("Error compressing uploaded images:", error);
    res.status(500).json({ error: "Image compression failed." });
  }
};

module.exports = {
  studentFileUploadMiddleware,
  processStudentFiles,
  uploadFacultyFilesMiddleware,
  processFacultyFiles,
  handleFileErrors,
  compressUploadedImages,
  studentFileUpdateMiddleware,
};
