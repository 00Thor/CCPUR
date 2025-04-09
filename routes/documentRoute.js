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

const router = express.Router();


router.post("/upload", uploadPdf.single("file"), uploadDocument);
router.get("/documents", getAllDocuments);
router.get("/documents/:doc_id", getSpecificDocument);
router.delete("/delete/:doc_id", deleteSpecificDocument);

router.get("/api/gallery-files", getGalleryFiles);
router.post("/api/gallery-files",uploadGeneral, compressUploadedFiles, uploadGalleryFiles);

router.get("/api/home-files", getHomeFiles);
router.post("/api/home-files", uploadGeneral, compressUploadedFiles, uploadHomeFiles);

router.delete("/api/deleteFiles", deleteUploadedFiles);
module.exports = router;