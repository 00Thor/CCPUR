const {
  BlobServiceClient
} = require("@azure/storage-blob");
const path = require("path");
const pool = require("../config/db");
const { uploadToBlob } = require("./azureBlobService");
require("dotenv").config();

const CONTAINER_NAME = "student-files"; 

const studentFilesUpload = async (req, client) => {
  try {
    const { user_id, application_id } = req.body;

    if (!user_id || !application_id) {
      throw new Error("User ID and Application ID are required for file uploads.");
    }

    if (!req.files || Object.keys(req.files).length === 0) {
      throw new Error("No files were uploaded.");
    }
    const filePaths = {};

    for (const [key, files] of Object.entries(req.files)) {
      const file = files[0]; // Assuming single file per field
      if (file) {
        console.log(`Processing file: ${key}`);
        console.log(`File size: ${file.size}`);
        console.log(`File buffer: ${file.buffer ? "Exists" : "Does not exist"}`);

        if (!file.buffer || !file.size) {
          throw new Error(`Invalid file data for field: ${key}`);
        }

        const blobName = `${application_id}/${key}-${file.originalname}`;
        filePaths[key] = await uploadToBlob(
          CONTAINER_NAME,
          null, // filePath is not used
          blobName,
          file.buffer, // Pass the file buffer
          file.size // Pass the file size
        );
      }
    }

    console.log("File paths generated:", filePaths);

    // Save file URLs to the database
    await client.query(
      `
      INSERT INTO file_uploads 
      (user_id, application_id, passport, signature, xadmitcard, xiiadmitcard, xmarksheet, xiimarksheet, migration, tribe)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `,
      [
        user_id,
        application_id,
        filePaths.passport || null,
        filePaths.signature || null,
        filePaths.xadmitcard || null,
        filePaths.xiiadmitcard || null,
        filePaths.xmarksheet || null,
        filePaths.xiimarksheet || null,
        filePaths.migration || null,
        filePaths.tribe || null,
      ]
    );

    return { success: true, filePaths };
  } catch (error) {
    console.error("Error uploading files:", error.message, error.stack);
    throw new Error("File upload failed. Please try again later.");
  }
};


//student files retreival
const getStudentFiles = async (req, res) => {
  try {
    const { user_id } = req.params;

    // Fetch file paths from the database
    const query = `
      SELECT passport, signature, tribe, xadmitcard, xiiadmitcard, xmarksheet, xiimarksheet, migration
      FROM file_uploads
      WHERE user_id = $1
    `;
    const fileResult = await pool.query(query, [user_id]);

    if (fileResult.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Files not found for the given user" });
    }

    const {
      passport,
      signature,
      tribe,
      xadmitcard,
      xiiadmitcard,
      xmarksheet,
      xiimarksheet,
      migration,
    } = fileResult.rows[0];

    // Structure file URLs
    const files = {
      passport_url: passport || null,
      signature_url: signature || null,
      tribe_url: tribe || null,
      xadmitcard_url: xadmitcard || null,
      xiiadmitcard_url: xiiadmitcard || null,
      xmarksheet_url: xmarksheet || null,
      xiimarksheet_url: xiimarksheet || null,
      migration_url: migration || null,
    };

    return res.status(200).json({
      message: "Successfully retrieved files",
      files,
    });
  } catch (error) {
    console.error("Error fetching files:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

//Update student file uploads
const updateStudentFiles = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { updates } = req.body;

    if (!user_id || !updates || !Array.isArray(updates)) {
      return res
        .status(400)
        .json({ error: "User ID and updates are required." });
    }

    const validColumns = [
      "passport",
      "signature",
      "xadmitcard",
      "xiiadmitcard",
      "xmarksheet",
      "xiimarksheet",
      "migration",
      "tribe",
    ];

    const blobServiceClient = BlobServiceClient.fromConnectionString(
      process.env.AZURE_STORAGE_CONNECTION_STRING
    );
    const containerName = CONTAINER_NAME;
    const containerClient = blobServiceClient.getContainerClient(containerName);

    const updatePromises = updates.map(async ({ column_name, file }) => {
      if (!validColumns.includes(column_name)) {
        throw new Error(`Invalid column name: ${column_name}`);
      }

      if (!file) {
        throw new Error(`No file provided for column: ${column_name}`);
      }

      const fileName = `${user_id}-${column_name}-${Date.now()}`;
      const blockBlobClient = containerClient.getBlockBlobClient(fileName);

      // Upload the file to Azure Blob Storage
      await blockBlobClient.uploadFile(file);

      const fileUrl = blockBlobClient.url;

      // Update the database with the new file URL
      await pool.query(
        `UPDATE file_uploads SET ${column_name} = $1 WHERE user_id = $2`,
        [fileUrl, user_id]
      );

      return { column_name, fileUrl };
    });

    const results = await Promise.all(updatePromises);

    res.status(200).json({
      success: true,
      message: "Files updated successfully.",
      results,
    });
  } catch (error) {
    console.error("Error updating files:", error);
    res
      .status(500)
      .json({ error: "File update failed. Please try again later." });
  }
};

// Delete student Files upload
const deleteStudentFiles = async (req, res) => {
  try {
    const { user_id, file_type } = req.body;

    if (!user_id || !file_type) {
      return res
        .status(400)
        .json({ error: "User ID and file type are required." });
    }

    const validColumns = [
      "passport",
      "signature",
      "xadmitcard",
      "xiiadmitcard",
      "xmarksheet",
      "xiimarksheet",
      "migration",
      "tribe",
    ];

    if (!validColumns.includes(file_type)) {
      return res
        .status(400)
        .json({ error: `Invalid file type: ${file_type}.` });
    }

    // Fetch the file path from the database
    const query = `SELECT ${file_type} AS file_path FROM file_uploads WHERE user_id = $1`;
    const result = await pool.query(query, [user_id]);

    if (result.rows.length === 0 || !result.rows[0].file_path) {
      return res
        .status(404)
        .json({ error: "File not found for the given user and type." });
    }

    const filePath = result.rows[0].file_path;
    const containerName = "uploads";

    // Initialize Azure Blob Service Client
    const blobServiceClient = BlobServiceClient.fromConnectionString(
      process.env.AZURE_STORAGE_CONNECTION_STRING
    );
    const containerClient = blobServiceClient.getContainerClient(containerName);

    // Delete the file from Azure Blob Storage
    const blockBlobClient = containerClient.getBlockBlobClient(
      path.basename(filePath)
    );
    const deleteResponse = await blockBlobClient.deleteIfExists();

    if (!deleteResponse.succeeded) {
      return res
        .status(500)
        .json({ error: "Failed to delete the file from Azure Blob Storage." });
    }

    // Update the database to set the file column to NULL
    const updateQuery = `UPDATE file_uploads SET ${file_type} = NULL WHERE user_id = $1`;
    await pool.query(updateQuery, [user_id]);

    res
      .status(200)
      .json({ success: true, message: "File deleted successfully." });
  } catch (error) {
    console.error("Error deleting file:", error);
    res
      .status(500)
      .json({ error: "File deletion failed. Please try again later." });
  }
};


module.exports = {
  studentFilesUpload,
  updateStudentFiles,
  getStudentFiles,
  deleteStudentFiles
};