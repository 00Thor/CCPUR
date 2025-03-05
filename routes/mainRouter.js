const express = require("express");

// Import individual route files
const alumniRoutes = require("./alumniRoutes");
const applicationRoutes = require("./applicationRoutes");
const basicUserRoutes = require("./basicUserRoute");
const examinationRoutes = require("./examinationRoutes");
const facultyAdminRoutes = require("./facultyAdminRoutes");
const fileUploadRoutes = require("./fileUploadRoutes");
const paymentRoutes = require("./paymentRoutes");
const statisticsRoutes  = require("./statisticsRoute")

const router = express.Router();

// Mount individual route files
router.use("/alumni", alumniRoutes);
router.use("/application", applicationRoutes);
router.use("/user", basicUserRoutes);
router.use("/examination", examinationRoutes);
router.use("/facultyAdmin", facultyAdminRoutes);
router.use("/fileupload", fileUploadRoutes);
router.use("/payments", paymentRoutes);
router.use("/statistics", statisticsRoutes);

module.exports = router;
