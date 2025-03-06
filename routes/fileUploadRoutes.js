
const express = require("express");
const {studentFileUploadMiddleware, uploadFacultyPhotoMiddleware }= require("../middleware/fileUploadMiddleware"); 
const { studentFilesUpload,/* getFilesByUserId,*/ getSecureFiles, uploadFacultyFiles, getFacultyFiles} = require("../controller/fileUploadController");
const { authenticateUser, authorizeRoles } = require("../middleware/basicAuth");

const router = express.Router();
  
// Upload Student files (passport and signature)
router.post("/studentFileUpload", authenticateUser,  studentFileUploadMiddleware, studentFilesUpload);

// Get all uploaded files metadata by user ID (requires authentication)
//router.get("/getfiles/:user_id", authenticateUser, authorizeRoles("student", "staff", "admin"), getFilesByUserId);

  // Securely retrieve a specific file by user ID and filename(get the actual file images to be viewed)
  router.get(
    "/secure-getfiles/:user_id", /*authenticateUser,
    authorizeRoles("student", "staff", "admin"),*/
    getSecureFiles
  );


// Separate file upload route
router.post("/facultyFileUpload", uploadFacultyPhotoMiddleware, uploadFacultyFiles);

//Get faculty files by faculty ID
router.get("/getFacultyFiles/:faculty_id", authenticateUser, authorizeRoles("staff", "admin"), getFacultyFiles);

module.exports = router;