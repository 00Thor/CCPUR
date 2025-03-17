const express = require("express");
const {
  studentFileUploadMiddleware,
  uploadFacultyPhotoMiddleware,
  compressUploadedImages,
} = require("../middleware/fileUploadMiddleware");
const {
  studentFilesUpload,
  getSecureFiles,
  uploadFacultyFiles,
  getFacultyFiles,
} = require("../controller/fileUploadController");
const { authenticateUser, authorizeRoles } = require("../middleware/basicAuth");

const router = express.Router();

// Upload Student files (passport and signature)
router.post(
  "/studentFileUpload",
  authenticateUser,
  studentFileUploadMiddleware,
  compressUploadedImages, // Compress after upload
  studentFilesUpload
);

// Securely retrieve specific files by user ID and filename
router.get(
  "/secure-getfiles/:user_id",
  /*authenticateUser,
    authorizeRoles("student", "staff", "admin"),*/
  getSecureFiles
);

// Faculty file upload
router.post(
  "/facultyFileUpload",
  authenticateUser,
  uploadFacultyPhotoMiddleware,
  compressUploadedImages, // Compress after upload
  uploadFacultyFiles
);

// Get faculty files by faculty ID
router.get(
  "/getFacultyFiles/:faculty_id",
  authenticateUser,
  authorizeRoles("staff", "admin"),
  getFacultyFiles
);

module.exports = router;
