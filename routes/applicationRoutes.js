const express = require("express");
const {
  newStudentApplication,
} = require("../controller/newStudentApplication");
const {
  studentFileUploadMiddleware,
  handleFileErrors,
} = require("../middleware/fileUploadMiddleware");
const {
  getPendingApplications,
  getApprovedApplications,
  approveApplicant,
  rejectApplication,
  getSingleApplication,
  approveYearlyApplication,
} = require("../controller/applicationApprovalController");
const { authenticateUser, authorizeRoles } = require("../middleware/basicAuth");
const { getLatestStudents } = require("../controller/adminController");
const { studentFilesUpload } = require("../controller/fileUploadController");
// const { viewapplication } = require("../controller/viewApplication");

const router = express.Router();

// Route to submit new student application (protected by file upload handling)
router.post(
  "/newApplication",
  studentFileUploadMiddleware,
  handleFileErrors,
  newStudentApplication
);

// Route to get the latest admitted students (admin only)
router.get("/students/latest", getLatestStudents);

// Route to fetch all pending applications (admin only)
router.get(
  "/getPendingApplications",
  getPendingApplications
);

// Route to fetch all pending applications (admin only)
router.get(
  "/getApprovedApplications",
  getApprovedApplications
);


// Route to fetch a single application (admin only)
router.get(
  "/getSingleApplications/:user_id", authenticateUser,
  getSingleApplication
);

// Route to approve a new student application (admin only)
router.put(
  '/approveApplicant/:application_id',
  approveApplicant
);

// Route to reject a new student application (admin only)
router.put(
  "/rejectApplication",
  rejectApplication
);

// Route for uploading student files (public, with file validation)
router.post(
  "/studentFilesUpload",
  studentFileUploadMiddleware,
  handleFileErrors,
  studentFilesUpload
);

// Route to approve yearly semester applications
router.put(
  "/approveYearlySemester",
  authenticateUser,
  authorizeRoles("admin"),
  approveYearlyApplication
);
module.exports = router;
