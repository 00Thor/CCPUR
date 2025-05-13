const { BlobServiceClient } = require("@azure/storage-blob");
const { v4: uuidv4 } = require("uuid");
const db = require("../config/db"); 
require("dotenv").config();

// Azure Blob Storage configuration
const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
const CONTAINER_NAME = "webpagefiles"; // Azure Blob container name

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
// upload for gallery
const uploadGalleryFiles = async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: "No files were uploaded." });
      }
  
      let successfulUploads = 0;
  
      for (const file of req.files) {
        const { buffer, originalname, mimetype } = file;
  
        try {
          const { fileUrl } = await uploadToAzure(buffer, originalname, mimetype);
        
          // Retrieve the current uploaded_files array
          const result = await db.query(
            `SELECT uploaded_files FROM webpageFiles WHERE name = 'gallery'`
          );
        
          const currentFiles = result.rows[0]?.uploaded_files || []; // Default to empty array if null
        
          // Append the new file URL to the existing array
          const updatedFiles = [...currentFiles, fileUrl];
        
          // Update the database with the new array
          await db.query(
            `UPDATE webpageFiles SET uploaded_files = $1 WHERE name = 'gallery'`,
            [JSON.stringify(updatedFiles)] // No need for `name` here
          );
  
          successfulUploads++;
        } catch (uploadError) {
          console.error(`Error uploading file (${originalname}):`, uploadError.message);
        }
      }
  
      if (successfulUploads > 0) {
        return res.status(201).json({
          success: true,
          message: `${successfulUploads} file(s) uploaded successfully.`,
        });
      }
  
      return res.status(500).json({
        error: "No files were successfully uploaded to Azure.",
      });
    } catch (error) {
      console.error("Error during file upload process:", error.message);
      res.status(500).json({ error: "File upload process failed." });
    }
  };

// retrieve uploaded files
const getGalleryFiles = async (req, res) => {
  try {
    // Fetch the file URLs from the database
    const result = await db.query(`SELECT id, uploaded_files FROM webpageFiles where name ='gallery';`);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "No files found." });
    }

    // Parse the `uploaded_files` column and return the result
    const uploadedFiles = result.rows.map((row) => {
      const files = Array.isArray(row.uploaded_files)
        ? row.uploaded_files
        : JSON.parse(row.uploaded_files || "[]"); // Fallback to an empty array if parsing fails
      return { id: row.id, galleryfiles: files };
    });

    res.status(200).json({
      success: true,
      uploadedFiles,
    });
  } catch (error) {
    console.error("Error fetching uploaded files:", error.message);
    res.status(500).json({ error: "Failed to fetch uploaded files." });
  }
}
// home file upload
const uploadHomeFiles = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No files were uploaded." });
    }

    let successfulUploads = 0;

    for (const file of req.files) {
      const { buffer, originalname, mimetype } = file;

      try {
        const { fileUrl } = await uploadToAzure(buffer, originalname, mimetype);

        // Retrieve the current uploaded_files array
        const result = await db.query(
          `SELECT uploaded_files FROM webpageFiles WHERE name = 'home'`
        );

        const currentFiles = result.rows[0]?.uploaded_files || [];

        // Append the new file URL to the existing array
        const updatedFiles = [...currentFiles, fileUrl];

        // Update the database with the new array
        await db.query(
          `UPDATE webpageFiles SET uploaded_files = $1 WHERE name = 'home'`,
          [JSON.stringify(updatedFiles)]
        );

        successfulUploads++;
      } catch (uploadError) {
        console.error(`Error uploading file (${originalname}):`, uploadError.message);
      }
    }

    if (successfulUploads > 0) {
      return res.status(201).json({
        success: true,
        message: `${successfulUploads} file(s) uploaded successfully.`,
      });
    }

    return res.status(500).json({
      error: "No files were successfully uploaded to Azure.",
    });
  } catch (error) {
    console.error("Error during file upload process:", error.message);
    res.status(500).json({ error: "File upload process failed." });
  }
};

// retrieve Homefiles
const getHomeFiles = async (req, res) => {
  try {
    // Fetch the file URLs from the database
    const result = await db.query(`SELECT id, uploaded_files FROM webpageFiles where name ='home';`);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "No files found." });
    }

    // Parse the `uploaded_files` column and return the result
    const uploadedFiles = result.rows.map((row) => {
      const files = Array.isArray(row.uploaded_files)
        ? row.uploaded_files
        : JSON.parse(row.uploaded_files || "[]"); // Fallback to an empty array if parsing fails
      return { id: row.id, homeimages: files };
    });

    res.status(200).json({
      success: true,
      uploadedFiles,
    });
  } catch (error) {
    console.error("Error fetching uploaded files:", error.message);
    res.status(500).json({ error: "Failed to fetch uploaded files." });
  }
};

//delete
const deleteUploadedFiles = async (req, res) => {
  try {
    const { id, fileLink } = req.body;
    console.log(id, fileLink);
    if (!id || !fileLink) {
      return res.status(400).json({ error: "Entity ID and file link are required." });
    }

    // Fetch existing files for the given ID
    const result = await db.query(
      `SELECT uploaded_files FROM webpageFiles WHERE id = $1`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Entity not found." });
    }

    const uploadedFiles = Array.isArray(result.rows[0]?.uploaded_files)
      ? result.rows[0].uploaded_files
      : JSON.parse(result.rows[0]?.uploaded_files || "[]");

    if (!uploadedFiles.includes(fileLink)) {
      return res.status(400).json({ error: "File link not found for the specified entity." });
    }

    // Extract the blob name (file name) from the file link
    const urlParts = fileLink.split('/');
    const blobName = urlParts.slice(-1)[0]; // Get the last part of the URL

    // Initialize the Azure Blob Service Client
    const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);

    // Get the container client
    const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);

    // Get the blob client
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    try {
      // Attempt to delete the specific blob from Azure Blob Storage
      await blockBlobClient.deleteIfExists();
      console.log(`Deleted blob: ${blobName}`);
    } catch (err) {
      console.error(`Error deleting blob (${blobName}):`, err.message);
      return res.status(500).json({ error: "Failed to delete file from storage." });
    }

    // Remove the specific file link from the array
    const updatedFiles = uploadedFiles.filter((file) => file !== fileLink);

    // Update the database with the new array
    await db.query(
      `UPDATE webpageFiles SET uploaded_files = $1 WHERE id = $2`,
      [JSON.stringify(updatedFiles), id]
    );

    res.status(200).json({
      success: true,
      message: `File '${fileLink}' deleted successfully.`,
    });
  } catch (error) {
    console.error("Error in deleteHomeFiles:", error.message);
    res.status(500).json({ error: "Internal server error." });
  }
};

module.exports = {
  uploadGalleryFiles,
  getGalleryFiles,
  uploadHomeFiles,
  getHomeFiles,
  deleteUploadedFiles
};