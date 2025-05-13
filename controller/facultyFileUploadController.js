const { BlobServiceClient } = require("@azure/storage-blob");
const pool = require("../config/db");
const { v4: uuidv4 } = require("uuid");
require("dotenv").config();

const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
const CONTAINER_NAME = "faculty-files";

if (!AZURE_STORAGE_CONNECTION_STRING) {
  throw new Error("Azure Storage connection string not configured.");
}

// Initialize BlobServiceClient
const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);

// Upload faculty files to Azure Blob Storage
const uploadFacultyFiles = async (client, faculty_id, files, res) => {
 
  if (!faculty_id) throw new Error("No faculty ID provided.");
  if (!files.profile_photos || Object.keys(files.profile_photos).length === 0) {
    return res.status(400).json({message:"No files uploaded or invalid files structure."});
  }

  // Define field mappings
  const fieldMapping = {
    profile_photos: "profile_photos",
    books_published_images: "books_published",
    books_published_pdfs: "books_published",
    seminars_attended_images: "seminars_attended",
    seminars_attended_pdfs: "seminars_attended",
  };

  let localClient = client;
  let transactionStarted = false;

  try {
    // Use the provided client or establish a new connection
    if (!client) {
      localClient = await pool.connect();
      transactionStarted = true;
    }

    // Begin transaction if managed here
    if (transactionStarted) {
      await localClient.query("BEGIN");
    }

    for (const [fieldName, fileArray] of Object.entries(files)) {
      const fileType = fieldMapping[fieldName];
      if (!fileType) continue;

      for (const file of fileArray) {
        // Upload file to Azure Blob Storage
        const blobName = `faculty/${faculty_id}/${file.originalname}`;
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);
        await blockBlobClient.uploadData(file.buffer);

        const blobUrl = blockBlobClient.url;

        // Insert file details into the database
        const query = `
          INSERT INTO faculty_files (faculty_id, file_type, file_path)
          VALUES ($1, $2, $3)
        `;
        await localClient.query(query, [faculty_id, fileType, blobUrl]);
      }
    }

    // Commit the transaction if managed here
    if (transactionStarted) {
      await localClient.query("COMMIT");
    }

    return { message: "Files uploaded successfully to Azure Blob Storage." };
  } catch (error) {
    if (transactionStarted) {
      await localClient.query("ROLLBACK");
    }

    console.error("Error saving faculty files:", error.message);
    throw new Error(`Failed to save faculty files: ${error.message}`);
  } finally {
    if (transactionStarted) {
      localClient.release();
    }
  }
};



// Fetch Faculty Files with Azure Blob URLs
const getFacultyFiles = async (req, res) => {
  try {
    const { faculty_id } = req.params;

    const query = `
      SELECT file_type, file_path
      FROM faculty_files
      WHERE faculty_id = $1
    `;
    const result = await pool.query(query, [faculty_id]);

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "No files found for the given faculty member." });
    }

    // Group files by file_type
    const files = result.rows.reduce((acc, row) => {
      const { file_type, file_path } = row;
      if (!acc[file_type]) {
        acc[file_type] = [];
      }
      acc[file_type].push(file_path);
      return acc;
    }, {});

    res.status(200).json({
      message: "Successfully retrieved files.",
      files,
    });
  } catch (error) {
    console.error("Error fetching files:", error);
    res.status(500).json({ error: "Internal Server Error." });
  }
};

const updateFacultyFiles = async (req, res) => {
  try {
    const { faculty_id } = req.params;

    if (!faculty_id) {
      return res.status(400).json({ error: "Faculty ID is required." });
    }

    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({ error: "No files provided for upload." });
    }

    const containerName = "faculty-files";
    const blobServiceClient = BlobServiceClient.fromConnectionString(
      process.env.AZURE_STORAGE_CONNECTION_STRING
    );
    const containerClient = blobServiceClient.getContainerClient(containerName);

    const uploadedFiles = [];

    // Iterate over all fields in req.files
    for (const [fileType, files] of Object.entries(req.files)) {
      for (const file of files) {
        // Construct the blob name with the faculty_id and file type as part of the folder structure
        const blobName = `faculty/${faculty_id}/${fileType}/${file.originalname}`;
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);

        // Check if the blob already exists
        const blobExists = await blockBlobClient.exists();

        // Upload file to Azure Blob Storage (overwrite if it already exists)
        await blockBlobClient.uploadData(file.buffer, {
          blobHTTPHeaders: { blobContentType: file.mimetype },
        });

        // Query the database to check if a record exists for this faculty_id and file_type
        const queryCheck = `
          SELECT * FROM faculty_files 
          WHERE faculty_id = $1 AND file_type = $2;
        `;
        const result = await pool.query(queryCheck, [faculty_id, fileType]);

        if (result.rows.length > 0) {
          // Update the existing record with the new file path
          const queryUpdate = `
            UPDATE faculty_files 
            SET file_path = $1 
            WHERE faculty_id = $2 AND file_type = $3 
            RETURNING *;
          `;
          const updatedResult = await pool.query(queryUpdate, [
            blockBlobClient.url,
            faculty_id,
            fileType,
          ]);
          uploadedFiles.push(updatedResult.rows[0]);
        } else {
          // Insert a new record into the database
          const queryInsert = `
            INSERT INTO faculty_files (faculty_id, file_type, file_path)
            VALUES ($1, $2, $3)
            RETURNING *;
          `;
          const insertedResult = await pool.query(queryInsert, [
            faculty_id,
            fileType,
            blockBlobClient.url,
          ]);
          uploadedFiles.push(insertedResult.rows[0]);
        }
      }
    }

    res.status(200).json({
      success: "Files updated successfully.",
      uploadedFiles,
    });
  } catch (error) {
    console.error("Error updating files:", error.message);
    res.status(500).json({ error: "Failed to update files. Please try again later." });
  }
};
  
  // Delete aculty Files
  const deleteFacultyFiles = async (req, res) => {
    try {
      const { faculty_id } = req.params;
      const { fileType, fileUrl } = req.body;
  
      if (!faculty_id) {
        return res.status(400).json({ error: "Faculty ID is required." });
      }
  
      if (!fileType || !fileUrl) {
        return res.status(400).json({ error: "File type and file URL are required." });
      }
  
      if (!["profile_photos", "books_published", "seminars_attended"].includes(fileType)) {
        return res.status(400).json({ error: "Invalid file type provided." });
      }
  
      // Update the database to remove the file URL from the array
      const query = `
        UPDATE faculty_files 
        SET ${fileType} = array_remove(${fileType}, $1) 
        WHERE faculty_id = $2
        RETURNING *;
      `;
  
      const result = await pool.query(query, [fileUrl, faculty_id]);
  
      if (result.rowCount === 0) {
        return res.status(404).json({ error: "Faculty not found." });
      }
  
      // Delete the file from Azure Blob Storage
      const containerName = "faculty-files";
      const blobServiceClient = BlobServiceClient.fromConnectionString(
        process.env.AZURE_STORAGE_CONNECTION_STRING
      );
      const containerClient = blobServiceClient.getContainerClient(containerName);
      const blobName = fileUrl.split("/").pop().split("?")[0]; // Extract blob name from URL
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  
      try {
        await blockBlobClient.delete();
      } catch (error) {
        console.error("Error deleting file from Azure:", error);
      }
  
      res.status(200).json({
        success: "File deleted successfully.",
        updatedFiles: result.rows[0],
      });
    } catch (error) {
      console.error("Error deleting files:", error);
      res.status(500).json({ error: "Failed to delete file. Please try again later." });
    }
  };
  
  module.exports = {
    uploadFacultyFiles,
    getFacultyFiles,
    updateFacultyFiles,
    deleteFacultyFiles
  };