const express = require("express");
const {
  newStudentApplication
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
  getSingleApps,
  getSingleApplication,
  approveYearlyApplication,
  getRejectedApplications,
} = require("../controller/applicationApprovalController");
const { authenticateUser, authorizeRoles, authorizeSelfAccess} = require("../middleware/basicAuth");
const { getLatestStudents } = require("../controller/adminController");
const { studentFilesUpload } = require("../controller/studentFileUploadController");


const router = express.Router();

// Route to submit new student application (protected by file upload handling)
router.post(
  "/newApplication",
  //authenticateUser,
  studentFileUploadMiddleware,
  handleFileErrors,
  newStudentApplication
);

// Route to get the latest admitted students (admin only)
router.get("/students/latest",authenticateUser, authorizeRoles('admin'), getLatestStudents);

// Route to fetch all pending applications (admin only)
router.get(
  "/getPendingApplications",
  //authenticateUser,
  //authorizeRoles("admin"),
  getPendingApplications
);

router.get(
  "/getRejectedApplications",
  //authenticateUser,
  //authorizeRoles("admin"),
  getRejectedApplications
);

//Route to fetch all approved applications (admin only)
router.get(
  "/getApprovedApplications",
  authenticateUser,
  authorizeRoles('admin'),
  getApprovedApplications
);



// Route to fetch a single application (admin only)
router.get(
  "/getSingleApplication/:user_id",
  //authenticateUser,
  //authorizeRoles("admin", "staff"),
  getSingleApplication
);

// Route to fetch their own application (only Self Access)
router.get(
  "/getSingleApps/:user_id",
  //authenticateUser,
  //authorizeSelfAccess,
  getSingleApps
);

// Route to approve a new student application (admin only)
router.put(
  '/approveApplicant/:application_id',
  //authenticateUser,
 // authorizeRoles('admin'),
  approveApplicant
);

// Route to reject a new student application (admin only)
router.put(
  "/rejectApplication/:application_id",
  authenticateUser,
  authorizeRoles("admin"),
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
  //authenticateUser,
  //authorizeRoles("admin"),
  approveYearlyApplication
);
module.exports = router;
