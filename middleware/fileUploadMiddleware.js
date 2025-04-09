const multer = require("multer");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");
const { v4: uuidv4 } = require("uuid");

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
const uploadDir = path.resolve("./uploads");
const facultyPhotoDir = path.resolve("./uploads/facultyPhoto");

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
  return `${Date.now()}-${uuidv4()}-${file.originalname.replace(/\s+/g, "_")}`;
};

// Storage configuration for student uploads
const studentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, generateFileName(file));
  },
});

const compressImage = async (filePath, destinationPath, mimeType) => {
  if (mimeType.startsWith("image/")) {
    try {
      await sharp(filePath)
        .resize({ width: 800 })
        .jpeg({ quality: 80 })
        .toFile(destinationPath);
      
      if (fs.existsSync(destinationPath)) {
        fs.unlinkSync(filePath);
      }
    } catch (err) {
      console.error("Image compression error:", err);
      throw new Error("Failed to compress image.");
    }
  }
};

// Student File Upload
const studentFileUploadMiddleware = multer({
  storage: studentStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Limit file size to 1 MB
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


// Faculty storage configuration
const facultyStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, facultyPhotoDir);
  },
  filename: (req, file, cb) => {
    cb(null, generateFileName(file));
  },
});

// faculty file upload
const uploadFacultyFilesMiddleware = multer({
  storage: facultyStorage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter,
}).any();



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

module.exports = {
  studentFileUploadMiddleware,
  uploadFacultyFilesMiddleware,
  handleFileErrors,
  compressUploadedImages,
};


/*
const { Storage } = require("@google-cloud/storage");
const multer = require("multer");
const sharp = require("sharp");
const path = require("path");
require("dotenv").config();

// Google Cloud Storage setup
const storage = new Storage({
  projectId: "your-project-id", // Replace with your Google Cloud project ID
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS, // Path to the credentials file
});

const bucketName = "your-bucket-name"; // Replace with your GCS bucket name

// Common file filter for allowed MIME types
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ["image/jpeg", "image/png", "application/pdf"];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only JPEG, PNG, and PDF files are allowed."));
  }
};

// Multer storage configuration for in-memory uploads
const multerStorage = multer.memoryStorage();

const uploadMiddleware = multer({
  storage: multerStorage,
  limits: { fileSize: 1 * 1024 * 1024 }, // Limit file size to 1 MB
  fileFilter,
});

// Helper to compress image before upload
const compressImageBuffer = async (file) => {
  try {
    const compressedBuffer = await sharp(file.buffer)
      .resize({ width: 800 }) // Resize image to max width of 800px
      .jpeg({ quality: 80 }) // Compress to 80% quality
      .toBuffer();
    return compressedBuffer;
  } catch (err) {
    console.error("Image compression error:", err);
    throw new Error("Failed to compress image.");
  }
};

// Helper to upload file to GCS
const uploadToGCS = async (file, folder) => {
  const bucket = storage.bucket(bucketName);
  const fileName = `${folder}/${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`;
  const blob = bucket.file(fileName);

  const bufferToUpload = file.mimetype.startsWith("image/")
    ? await compressImageBuffer(file)
    : file.buffer; // Compress images, upload others as is

  const blobStream = blob.createWriteStream({
    resumable: false,
    contentType: file.mimetype,
    metadata: {
      cacheControl: "public, max-age=31536000",
    },
  });

  return new Promise((resolve, reject) => {
    blobStream.on("error", (err) => reject(err));
    blobStream.on("finish", () => {
      const publicUrl = `https://storage.googleapis.com/${bucketName}/${fileName}`;
      resolve(publicUrl);
    });
    blobStream.end(bufferToUpload);
  });
};

// Middleware for student file uploads
const studentFileUploadMiddleware = [
  uploadMiddleware.fields([
    { name: "passport", maxCount: 1 },
    { name: "signature", maxCount: 1 },
    { name: "xmarksheet", maxCount: 1 },
    { name: "xadmitcard", maxCount: 1 },
    { name: "xiiadmitcard", maxCount: 1 },
    { name: "xiimarksheet", maxCount: 1 },
    { name: "migration", maxCount: 1 },
    { name: "tribe", maxCount: 1 },
  ]),
  async (req, res, next) => {
    try {
      const files = req.files;
      const uploadPromises = [];

      for (const fieldName in files) {
        files[fieldName].forEach((file) => {
          uploadPromises.push(uploadToGCS(file, "students"));
        });
      }

      const uploadedFiles = await Promise.all(uploadPromises);
      req.uploadedFiles = uploadedFiles; // Add URLs to the request object for further use
      next();
    } catch (error) {
      next(error);
    }
  },
];

// Middleware for faculty photo uploads
const uploadFacultyPhotoMiddleware = [
  uploadMiddleware.single("faculty_picture"),
  async (req, res, next) => {
    try {
      if (!req.file) {
        throw new Error("No file uploaded");
      }

      const uploadedFileUrl = await uploadToGCS(req.file, "facultyPhotos");
      req.uploadedFileUrl = uploadedFileUrl; // Add URL to the request object for further use
      next();
    } catch (error) {
      next(error);
    }
  },
];

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
};
*/

// ******************* Azure Blob Storage ****************************** //
/*
const multer = require("multer");
const sharp = require("sharp");
const { v4: uuidv4 } = require("uuid");
const { BlobServiceClient } = require("@azure/storage-blob");

// Azure Blob Storage configuration
const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING);
const studentContainerName = "student-files";
const facultyContainerName = "faculty-photos";
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
const uploadFacultyPhotoMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1 * 1024 * 1024 }, // Limit file size to 1 MB
  fileFilter,
}).single("faculty_picture");

const processFacultyPhoto = async (req, res, next) => {
  try {
    if (!req.file) return next();

    req.uploadedFile = await uploadToAzureBlob(facultyContainerClient, req.file, "faculty_picture");
    next();
  } catch (error) {
    console.error("Error uploading faculty photo to Azure:", error);
    res.status(500).json({ error: "Faculty photo upload failed." });
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

module.exports = {
  studentFileUploadMiddleware,
  processStudentFiles,
  uploadFacultyPhotoMiddleware,
  processFacultyPhoto,
  handleFileErrors,
};
*/