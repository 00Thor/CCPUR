const express = require('express');
const {
    getTeachingStaff, 
    getNonTeachingStaff, 
    newFaculty,
    retrieveSpecificFacultyById,
    deleteFaculty,
    updateFacultyPersonalDetails,
    getAllFaculty
} = require('../controller/basicFacultyController');
const { getAllStudentsDetails, getStudentById, deleteStudent, updateStudent, getLatestStudents } = require('../controller/adminController');
const { handleFileErrors, uploadFacultyFilesMiddleware, processFacultyFiles } = require('../middleware/fileUploadMiddleware');
const { insertFacultyAcademicRecords, deleteFacultyAcademicRecords, updateFacultyRecords, readFacultyAcademicRecords } = require('../controller/facultyAcademicRecordsController');
const { createCommitteeRoles, retrieveFacultyCommitteeRoles, updateCommitteeRoles, deleteFacultyCommiteeRoles } = require('../controller/committeeRolesController');
const { authenticateUser, authorizeRoles, authorizeSelfAccess } = require('../middleware/basicAuth');
const { getFacultyFiles, uploadFacultyFiles, updateFacultyFiles } = require('../controller/facultyFileUploadController');
const handleFacultyCRUDController = require('../controller/faccultyCRUDController');


const router = express.Router();

/* ************************* STUDENT **************************** */

// Route to fetch student details (Admin & Staff)
router.get('/getStudentDetails/:user_id',authenticateUser, authorizeRoles('admin'), getStudentById);

// Route to fetch student details (Admin & Staff)
router.get('/getAllStudentDetails',authenticateUser,authorizeRoles('admin'), getAllStudentsDetails);

// Route to update student details(Admin Only)
router.put('/updateStudentDetails/:user_id', authenticateUser, authorizeRoles('admin'), updateStudent);

// Route to delete student details(Admin Only)
router.delete('/deleteStudentDetails/:user_id',authenticateUser, authorizeRoles('admin'), deleteStudent);

// Route to fetch all/some faculty details (Admin Only)
router.get('/getLatestStudent',authenticateUser,authorizeRoles('admin'), getLatestStudents);


/* **************** FACULTY SECTION *************************** */

// Teaching & Non-Teaching Routes
router.get('/teaching-staff',getTeachingStaff);
router.get('/non-teaching-staff',getNonTeachingStaff);


// Faculty Details(personal, academic, committee roles)
 router.get('/singleFaculty/:faculty_id', /*authenticateUser, authorizeRoles('admin'), authorizeSelfAccess,*/ retrieveSpecificFacultyById);

// Entering a new faculty with all Details(Personal, academic, committee roles, files)
router.post('/handleFacultyInsert', authenticateUser, authorizeRoles('admin'), uploadFacultyFilesMiddleware,
  handleFileErrors, handleFacultyCRUDController);

//GET complete faculty personal details(from all tables)
router.get("/getAllFaculty", getAllFaculty)



/*************************************** INDIVIDUALFACULTY DETAILS ACTIONS *********************************** */

//####  PERSONAL
//enter Faculty personal details only
router.post("/faculty-registration",
  authenticateUser,
  authorizeRoles('admin'),
  handleFileErrors,
  newFaculty
);

// Get faculty files by faculty ID
router.get(
  "/getFacultyFiles/:faculty_id",
  authenticateUser,
  authorizeRoles("admin"),
  authorizeSelfAccess,
  getFacultyFiles
);

// Faculty file upload
router.post(
  "/facultyFileUpload/:faculty_id",
 // authenticateUser,
  uploadFacultyFilesMiddleware,
  handleFileErrors,
  processFacultyFiles,
  uploadFacultyFiles
);

// Update faculty files by faculty ID
router.put(
  "/facultyFiles/:faculty_id",
  authenticateUser,
  authorizeRoles("admin"),
  updateFacultyFiles
);
//UPDATE faculty personal details
router.put("/updateFacultyDetails", updateFacultyPersonalDetails)

 //DELETE faculty personal details
 router.delete("/deleteFaculty/:faculty_id", deleteFaculty)


//##### ACADEMIC
//  CREATE faculty academic records
router.post('/facultyRecords', insertFacultyAcademicRecords);

// READ faculty academic records
router.get("/facultyRecords/:faculty_id", readFacultyAcademicRecords);

//UPDATE faculty academic records
router.put("/facultyrecords/:faculty_id", updateFacultyRecords);

// DELETE faculty academic records
router.delete('/facultyRecords/:faculty_id', deleteFacultyAcademicRecords);

//##### COMMITTEE ROLES
// CREATE & assign committee roles
router.post("/committeeRoles", createCommitteeRoles);

// GET / READ committee roles
router.get("/committeeRoles", retrieveFacultyCommitteeRoles);

// UPDATE committee roles
router.put("/committeeRoles", updateCommitteeRoles);

// DELETE committee roles
router.delete("/committeeRoles", deleteFacultyCommiteeRoles);

module.exports = router;