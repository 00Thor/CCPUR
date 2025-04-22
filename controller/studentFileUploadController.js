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
      throw new Error("User ID & application ID is required for file uploads.");
    }

    if (!req.files || Object.keys(req.files).length === 0) {
      throw new Error("No files were uploaded.");
    }

    const filePaths = {};

    for (const [key, files] of Object.entries(req.files)) {
      const file = files[0];
      if (file) {
        if (!file.buffer || !file.size) {
          throw new Error(`Invalid file data for field: ${key}`);
        }
        console.log('user_id:', user_id); // Check if this logs the correct user_id.

        // Use user_id as the folder name in Azure Blob Storage
        const blobName = `${user_id}/${key}-${file.originalname}`;
        console.log('blobName:', blobName); // Check the final blob name to see what value it holds
        filePaths[key] = await uploadToBlob(
          CONTAINER_NAME, 
          null,
          blobName,
          file.buffer,
          file.size
        );
      }
    }
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
// update files
const updateStudentFiles = async (req, res) => {
  try {
      const { user_id } = req.params;
      const { file_type } = req.body;

      if (!user_id || !file_type || !req.file) {
          return res.status(400).json({ error: "User ID, file, and file type are required." });
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
          return res.status(400).json({ error: `Invalid file type: ${file_type}` });
      }

      const blobServiceClient = BlobServiceClient.fromConnectionString(
          process.env.AZURE_STORAGE_CONNECTION_STRING
      );
      const containerName = "student-files";
      const containerClient = blobServiceClient.getContainerClient(containerName);

      // Construct the blob name with the user_id as the folder prefix
      const fileName = `${user_id}/${user_id}-${file_type}-${Date.now()}-${req.file.originalname.replace(/\s+/g, "_")}`;
      const blockBlobClient = containerClient.getBlockBlobClient(fileName);

      // Upload file to Azure Blob Storage
      await blockBlobClient.upload(req.file.buffer, req.file.size);

      const fileUrl = blockBlobClient.url;

      // Update database with the file URL
      await pool.query(
          `
              INSERT INTO file_uploads (user_id, ${file_type})
              VALUES ($1, $2)
              ON CONFLICT (user_id)
              DO UPDATE SET ${file_type} = EXCLUDED.${file_type};
          `,
          [user_id, fileUrl]
      );

      res.status(200).json({
          success: true,
          message: "File updated successfully.",
          fileUrl: fileUrl // Optionally return the new file URL
      });
  } catch (error) {
      console.error("Error updating file:", error);
      res.status(500).json({ error: "File update failed. Please try again later." });
  }
};

const deleteStudentFiles = async (req, res) => {
    try {
        const { user_id } = req.params;
        if (!user_id) {
            return res.status(400).json({ error: "User ID is required." });
        }

        const { file_type } = req.query;
        if (!file_type) {
            return res.status(400).json({ error: "File type is required." });
        }

        console.log("File type:", file_type);

        const fileTypeMapping = {
            passport_url: "passport",
            signature_url: "signature",
            tribe_url: "tribe",
            xadmitcard_url: "xadmitcard",
            xiiadmitcard_url: "xiiadmitcard",
            xmarksheet_url: "xmarksheet",
            xiimarksheet_url: "xiimarksheet",
            migration_url: "migration",
        };

        const dbColumn = fileTypeMapping[file_type];
        if (!dbColumn) {
            return res.status(400).json({ error: `Invalid file type: ${file_type}.` });
        }

        // Fetch the existing file URL for the user
        const fetchQuery = `
            SELECT ${dbColumn} AS file_url
            FROM file_uploads
            WHERE user_id = $1;
        `;
        const fetchResult = await pool.query(fetchQuery, [user_id]);
        console.log(fetchResult.rows);

        if (fetchResult.rows.length === 0) {
            return res.status(404).json({ error: "File not found for the given user." });
        }

        const { file_url: fileUrl } = fetchResult.rows[0];
        if (!fileUrl) {
            return res.status(404).json({ error: "No file exists for the specified type." });
        }

        // Remove the file from Azure Blob Storage
        const blobServiceClient = BlobServiceClient.fromConnectionString(
            process.env.AZURE_STORAGE_CONNECTION_STRING
        );
        const containerName = "student-files";
        const containerClient = blobServiceClient.getContainerClient(containerName);

        // 1. Parse the Blob URL to get the blob name
        const urlParts = fileUrl.split(`/${containerName}/`);
        if (urlParts.length !== 2) {
            console.warn(`Unexpected file URL format: ${fileUrl}`);
            return res.status(500).json({ error: "Unexpected file URL format." });
        }

        const blobNameWithPrefix = urlParts[1]; // This will contain the folder (if any) and the filename

        // 2. Get the BlockBlobClient using the extracted blob name
        const blockBlobClient = containerClient.getBlockBlobClient(blobNameWithPrefix);

        // Delete the file from Azure Blob Storage
        try {
            await blockBlobClient.delete();
            console.log(`File ${blobNameWithPrefix} successfully deleted from Azure.`);
        } catch (azureError) {
            console.warn(`Azure Blob deletion failed: ${azureError.message}`);
            return res.status(500).json({ error: "Failed to delete file from Azure." });
        }

        // Remove the file entry from the database
        const deleteQuery = `
            UPDATE file_uploads
            SET ${dbColumn} = NULL
            WHERE user_id = $1;
        `;
        await pool.query(deleteQuery, [user_id]);

        res.status(200).json({
            success: true,
            message: `File of type ${file_type} deleted successfully.`,
        });
    } catch (error) {
        console.error("Error deleting file:", error.message);
        res.status(500).json({ error: "File deletion failed. Please try again later." });
    }
};

module.exports = {
  studentFilesUpload,
  updateStudentFiles,
  getStudentFiles,
  deleteStudentFiles
};