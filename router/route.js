const express = require("express");
const upload = require("../middleware/uploadFileMiddleware"); 
const { graduateStudent, restoreStudent } = require("../controller/graduationController");
const { deleteStaffDetails } = require('../models/facultyInfoModels');
const { submitPersonalDetails } = require("../controller/newStudentApplication");
const { submitEducationalDetailsAndFiles } = require("../controller/newApplicationPage2");
const { authenticateUser, authorizeRoles } = require('../middleware/basicAuth');
const { semesterExamination } = require("../controller/semesterExaminationController");
const { newUser, login, resetpassword, forgotpassword } = require("../controller/basicUserController");
const { uploadFiles, getFilesByUserId, getSecureFiles } = require("../controller/fileUploadController");
const { insertPaymentController, getPaymentsByStudentIdController, updatePaymentStatusController} = require('../controller/paymentController');
const { getTeachingStaff, getNonTeachingStaff, updateAttendance,facultyDashboard, updateStaffDetails } = require('../controller/facultyInfoController');
const { getStaffDetails,getAllStudentsDetails, getStudentsDetails, deleteStudent, updateStudent, getLatestStudents} = require('../controller/adminController');
const { getPendingApplications, approveApplicant, rejectApplication, getSingleApplication } = require('../controller/applicationApprovalController')
const { getAllRecords,getRecordsByStudent,addRecord,updateRecord,deleteRecord, } = require('../controller/academicRecordsController');


const router = express.Router();



/* *************************** SIMPLE OPREATIONS SECTION ************************** */

router.post("/register", newUser);
router.post("/login", login);
router.post("/resetpassword", resetpassword);
router.post("/forgotpassword", forgotpassword);



/* ************************* FILE UPLOADS SECTOIN ****************************** */

// Upload files (passport and signature)
router.post("/upload", upload, uploadFiles);

// Get all uploaded files metadata by user ID (requires authentication)
router.get("/getfiles/:user_id", authenticateUser, authorizeRoles("student", "staff", "admin"), getFilesByUserId);

  // Securely retrieve a specific file by user ID and filename(get the actual file images to be viewed)
  router.get(
    "/secure-getfiles/:user_id", authenticateUser,
    authorizeRoles("student", "staff", "admin"),
    getSecureFiles
  );


/* ************************* PAYMENTS SECTION *************************** */

// Route to insert payment
router.post('/payments', insertPaymentController);

// Route to fetch payments by student ID
router.get('/payments/student/:student_id', getPaymentsByStudentIdController);

// Route to update payment status
router.put('/payments/status', updatePaymentStatusController);


/* *************************FACULTY & ADMIN SECTION **************************** */


// Teaching & Non-Teaching Routes
router.get('/teaching-staff',  getTeachingStaff); //Protected route
router.get('/non-teaching-staff', authenticateUser, authorizeRoles('admin', 'staff'), getNonTeachingStaff); //Protected route

// Faculty and Admin Protected Routes
router.put('/updateAttendance', authenticateUser, authorizeRoles('staff', 'admin'), updateAttendance); // Protected Route

// Route to fetch student details (Admin & Staff)
router.get('/getStudentDetails', getStudentsDetails); // Protected Route

// Route to fetch student details (Admin & Staff)
router.get('/getAllStudentDetails', getAllStudentsDetails); // Protected Route

// Route to update student details(Admin Only)
router.put('/updateStudentDetails', authenticateUser, authorizeRoles('admin'), updateStudent);//Protected route

// Route to delete student details(Admin Only)
router.delete('/deleteStudentDetails', authenticateUser, authorizeRoles('admin'), deleteStudent); //Protected route

// Route to fetch all/some faculty details (Admin Only)
router.get('/getStaffDetails', getStaffDetails); // Protected Route

// Protected route: Faculty Dashboard(staff Only)
router.get('/faculty-Dashboard', authenticateUser, authorizeRoles('staff'), facultyDashboard); //Protected route

//Route to update Staff Details
router.put('/updateStaffDetails', authenticateUser, authorizeRoles('admin'), updateStaffDetails); //Protected route

//Route to delete Staff Details
router.delete('/deleteStaffDetails',authenticateUser, authorizeRoles('admin'), deleteStaffDetails);//ptotected route


/* ************************** APPLICATIONS SECTION ******************************* */

// Application Forms(NEW & OLD)
router.post("/newapplication1", submitPersonalDetails);
router.post("/newapplication2", upload, submitEducationalDetailsAndFiles);

// Application Forms(NEW & OLD)
//router.get("/myapplication", viewapplication);

// Route to get latest admitted students for only admin page display
router.get('/students/latest', getLatestStudents);

//Route to get all pending Applications
router.get('/getPendingApplications',  getPendingApplications);//ptotected route

//Route to get single applicant Applications
router.get('/getSingleApplications',authenticateUser, authorizeRoles('admin'), getSingleApplication);//ptotected route

//Route to approve New Student Applications
router.put('/approveApplicant',authenticateUser, authorizeRoles('admin'), approveApplicant);//ptotected route

//Route to reject New Student Applications
router.put('/rejectApplication',authenticateUser, authorizeRoles('admin'), rejectApplication);//ptotected route

/* ************************** File Uploads Section ******************************* */

// Separate file upload route
router.post("/fileupload", upload, uploadFiles);


/* ************************** Alumni Section ******************************* */

//Route to move student from 6th sem to Graduated
router.post("/archiveStudent", graduateStudent);

//Route to undo mistakenly moved student from 6th sem to Graduated 
router.post("/archiveStudent", restoreStudent);

/* ******************************** ACADEMIC SECTION ****************************** */

// SEMESTER Examination form
router.post("/semesterExamForm", authenticateUser, semesterExamination);

// Academic records(sem results)
router.get("/getallAcademicRecords", getAllRecords);
router.get("/getstudentAcademicRecord", getRecordsByStudent);
router.post("/addRecord", addRecord);
router.put("/updateAcademicRecords", updateRecord);
router.delete("/deleteAcademicRecords", deleteRecord);


module.exports = router;

