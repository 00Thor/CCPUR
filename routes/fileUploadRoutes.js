const express = require("express");
const {
  studentFileUploadMiddleware,
  compressUploadedImages,
  uploadFacultyFilesMiddleware,
  handleFileErrors,
  studentFileUpdateMiddleware,
  processFacultyFiles,
} = require("../middleware/fileUploadMiddleware");
const {
  studentFilesUpload,
  updateStudentFiles,
  deleteStudentFiles,
  getStudentFiles,
} = require("../controller/studentFileUploadController");
const { authenticateUser, authorizeRoles, authorizeSelfAccess } = require("../middleware/basicAuth");
const { uploadFacultyFiles, getFacultyFiles, deleteFacultyFiles } = require("../controller/facultyFileUploadController");

const router = express.Router();

// Upload Student files (all files)
router.post(
  "/studentFileUpload",
  authenticateUser,
  studentFileUploadMiddleware,
  compressUploadedImages,
  studentFilesUpload
);

// Securely retrieve student files by user ID and filename
router.get(
  "/secure-getfiles/:user_id",
  authenticateUser,
  authorizeRoles("staff", "admin"),
  getStudentFiles
);
// update student files 
router.put(
  "/updateFiles/:user_id",
  authenticateUser,
  authorizeRoles("admin"),
  studentFileUpdateMiddleware,
  compressUploadedImages,
  handleFileErrors,
  updateStudentFiles
);

// delete student files 
router.delete(
  "/deleteStudentFiles/:user_id",
  authenticateUser,
  authorizeRoles("admin"),
  deleteStudentFiles
);

// Get student files for self only(student dashboard)
router.get(
  "/getMyFiles/:user_id",
  authenticateUser,
  authorizeSelfAccess,
  getStudentFiles
);

// Faculty file upload
router.post(
  "/facultyFileUpload/:faculty_id",
  authenticateUser,
  uploadFacultyFilesMiddleware,
  handleFileErrors,
  processFacultyFiles,
  uploadFacultyFiles
);

// Get faculty files by faculty ID
router.get(
  "/getFacultyFiles/:faculty_id",
  authenticateUser,
  authorizeRoles("admin"),
  authorizeSelfAccess,
  getFacultyFiles
);

// Update faculty files by faculty ID
router.put(
  "/facultyFiles/:faculty_id",
  authenticateUser,
  authorizeRoles("admin"),
  uploadFacultyFiles
);

// delete faculty files by faculty ID
router.delete(
  "/facultyFiles/:faculty_id",
  authenticateUser,
  authorizeRoles("admin"),
  deleteFacultyFiles
);

module.exports = router;
