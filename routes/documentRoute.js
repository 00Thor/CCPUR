const express = require("express");
const {
  uploadGalleryFiles,
  getGalleryFiles,
  uploadHomeFiles,
  getHomeFiles,
  deleteUploadedFiles
} = require("../controller/webpageFilesController");
const {
  uploadDocument,
  getAllDocuments,
  getSpecificDocument,
  deleteSpecificDocument,
} = require("../controller/documentController");
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

router.get("/gallery-files", getGalleryFiles);
router.post("/gallery-files",authenticateUser, authorizeRoles('admin'), uploadGeneral, compressUploadedFiles, uploadGalleryFiles);

router.get("/home-files", getHomeFiles);
router.post("/home-files",authenticateUser, authorizeRoles('admin'), uploadGeneral, compressUploadedFiles, uploadHomeFiles);

router.delete("/deleteFiles",authenticateUser, authorizeRoles('admin'), deleteUploadedFiles);

module.exports = router;