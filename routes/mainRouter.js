const express = require("express");

// Import individual route files
const alumniRoutes = require("./alumniRoutes");
const applicationRoutes = require("./applicationRoutes");
const basicUserRoutes = require("./basicUserRoute");
const examinationRoutes = require("./examinationRoutes");
const AdminRoutes = require("./AdminRoutes");
const fileUploadRoutes = require("./fileUploadRoutes");
const paymentRoutes = require("./paymentRoutes");
const statisticsRoutes  = require("./statisticsRoute");
const academicRoutes = require("./academicRoutes");
const documentRoute = require("./documentRoute");
const verifyAadhaarRoute = require("./verifyAadhaarRoute");
const facultyRoutes = require("./basicFacultyRoutes");
const financeRoutes = require("./financeRoutes");


const router = express.Router();

// Mount individual route files
router.use("/alumni", alumniRoutes);
router.use("/application", applicationRoutes);
router.use("/user", basicUserRoutes);
router.use("/examination", examinationRoutes);
router.use("/admin", AdminRoutes);
router.use("/fileupload", fileUploadRoutes);
router.use("/payments", paymentRoutes);
router.use("/statistics", statisticsRoutes);
router.use('/academic', academicRoutes);
router.use("/doc", documentRoute);
router.use("/aadhaar", verifyAadhaarRoute);
router.use("/faculty", facultyRoutes)
router.use("/finance", financeRoutes)

module.exports = router;
