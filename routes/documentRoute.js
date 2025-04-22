const express = require("express");
const { uploadDocument,
        getAllDocuments,
        getSpecificDocument,
        deleteSpecificDocument,
        uploadGalleryFiles,
        getGalleryFiles,
        uploadHomeFiles,
        getHomeFiles,
        deleteUploadedFiles} = require('../controller/documentController');
const { uploadPdf,
        uploadGeneral,
        compressUploadedFiles,
        } = require ("../middleware/documentMulterConfig");
const { authenticateUser, authorizeRoles } = require("../middleware/basicAuth");

const router = express.Router();


router.post("/upload", uploadPdf.single("file"),authenticateUser, authorizeRoles('admin'), uploadDocument);
router.get("/documents", getAllDocuments);
router.get("/documents/:doc_id", getSpecificDocument);
router.delete("/delete/:doc_id",authenticateUser, authorizeRoles('admin'), deleteSpecificDocument);

router.get("/api/gallery-files", getGalleryFiles);
router.post("/api/gallery-files",authenticateUser, authorizeRoles('admin'), uploadGeneral, compressUploadedFiles, uploadGalleryFiles);

router.get("/api/home-files", getHomeFiles);
router.post("/api/home-files",authenticateUser, authorizeRoles('admin'), uploadGeneral, compressUploadedFiles, uploadHomeFiles);

router.delete("/api/deleteFiles",authenticateUser, authorizeRoles('admin'), deleteUploadedFiles);

module.exports = router;