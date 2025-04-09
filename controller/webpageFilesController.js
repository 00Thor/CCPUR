const { BlobServiceClient } = require("@azure/storage-blob");
const { v4: uuidv4 } = require("uuid");
const client = require("../config/db"); // Database connection

// Azure Blob Storage configuration
const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
const CONTAINER_NAME = "uploads"; // Azure Blob container name

// Initialize Azure Blob Service Client
const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);

// Helper function to upload files to Azure Blob Storage
const uploadToAzure = async (fileBuffer, fileName, contentType) => {
  const blobName = `${uuidv4()}-${fileName}`;
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  // Ensure the container exists
  await containerClient.createIfNotExists();

  // Upload the file
  await blockBlobClient.uploadData(fileBuffer, {
    blobHTTPHeaders: { blobContentType: contentType },
  });

  return { blobName, fileUrl: blockBlobClient.url };
};
const uploadFiles = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      throw new Error("Name is required to upload files.");
    }

    if (!req.files || Object.keys(req.files).length === 0) {
      throw new Error("No files were uploaded.");
    }

    // Initialize Azure Blob Service Client
    const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
    const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);

    const uploadedFileURLs = [];

    // Iterate over uploaded files and upload them to Azure Blob Storage
    for (const file of Object.values(req.files)) {
      const blobName = `${name}/${file.originalname}`;
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);

      // Upload file buffer directly to Azure
      await blockBlobClient.uploadData(file.buffer);

      // Push uploaded file URL to the array
      uploadedFileURLs.push(blockBlobClient.url);
    }

    // Save file URLs to the database
    await client.query(
      `UPDATE webpageFiles SET uploaded_files = $1 WHERE name = $2`,
      [JSON.stringify(uploadedFileURLs), name]
    );

    // Return success response
    res.status(201).json({ success: true, fileURLs: uploadedFileURLs });
  } catch (error) {
    console.error("Error uploading files:", error.message);
    res.status(500).json({ error: error.message || "File upload failed." });
  }
};

  // retrieve uploaded files
  const getUploadedFiles = async (req, res) => {
    try {
      const { name } = req.body;
  
      if (name) {
        throw new Error("Name is required.");
      }
  
      // Fetch the file URLs from the database
      const result = await client.query(
        `SELECT uploaded_files FROM webpageFiles WHERE name = $1`,
        [entity_id]
      );
  
      if (result.rowCount === 0) {
        return res.status(404).json({ error: "Entity not found." });
      }
  
      const { uploaded_files } = result.rows[0];
  
      res.status(200).json({ success: true, uploadedFiles: uploaded_files || [] });
    } catch (error) {
      console.error("Error fetching uploaded files:", error.message);
      res.status(500).json({ error: error.message || "Failed to fetch uploaded files." });
    }
  };
  
  
  // delete files
  const deleteUploadedFiles = async (req, res) => {
    try {
      const { name } = req.body; // Entity identifier
      const { fileNames } = req.body; // Array of file names to delete (optional)
  
      if (name) {
        throw new Error("Entity ID is required.");
      }
  
      // Fetch existing files for the entity
      const result = await client.query(
        `SELECT uploaded_files FROM webpageFiles WHERE name = $1`,
        [name]
      );
  
      if (result.rowCount === 0) {
        return res.status(404).json({ error: "Entity not found." });
      }
  
      const { uploaded_files } = result.rows[0];
  
      if (!uploaded_files || uploaded_files.length === 0) {
        return res.status(400).json({ error: "No files to delete." });
      }
  
      const remainingFiles = [];
      const filesToDelete = [];
  
      if (fileNames && fileNames.length > 0) {
        // Delete specified files
        uploaded_files.forEach((file) => {
          const fileName = file.split("/").pop(); // Extract file name
          if (fileNames.includes(fileName)) {
            filesToDelete.push(file); // Mark for deletion
          } else {
            remainingFiles.push(file); // Keep other files
          }
        });
      } else {
        // Delete all files
        filesToDelete.push(...uploaded_files);
      }
  
      // Remove files from cloud storage
      const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
      const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);
  
      for (const file of filesToDelete) {
        const blobName = file.split("/").slice(-2).join("/"); // Extract blob name
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  
        try {
          await blockBlobClient.deleteIfExists(); // Delete blob
        } catch (err) {
          console.error("Error deleting file from storage:", blobName, err.message);
        }
      }
  
      // Update database
      await client.query(
        `UPDATE webpageFiles SET uploaded_files = $1 WHERE name = $2`,
        [remainingFiles.length > 0 ? JSON.stringify(remainingFiles) : null, entity_id]
      );
  
      res.status(200).json({
        success: true,
        message: fileNames
          ? `${filesToDelete.length} files deleted successfully.`
          : "All files deleted successfully.",
        remainingFiles,
      });
    } catch (error) {
      console.error("Error deleting uploaded files:", error.message);
      res.status(500).json({ error: error.message || "Failed to delete files." });
    }
  };

  module.exports = {
    deleteUploadedFiles,
    getUploadedFiles,
    uploadFiles    
  }