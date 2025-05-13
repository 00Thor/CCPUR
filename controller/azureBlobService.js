
const { BlobServiceClient } = require("@azure/storage-blob");
require("dotenv").config();
const mime = require("mime-types");
const fs = require("fs");
const blobServiceClient = BlobServiceClient.fromConnectionString(
  process.env.AZURE_STORAGE_CONNECTION_STRING
);

async function uploadToBlob(containerName, filePath = null, blobName, fileBuffer = null, fileSize = 0) {
  try {
    const containerClient = blobServiceClient.getContainerClient(containerName);

    // Ensure the container exists
    await containerClient.createIfNotExists();

    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    // Upload directly from buffer if provided
    const contentType = mime.lookup(blobName) || "application/inline";
    if (fileBuffer && fileSize > 0) {

      await blockBlobClient.upload(fileBuffer, fileSize, {
        blobHTTPHeaders: {
          blobContentType: contentType,
        },
      });
    } 
    // Upload from file path if provided
    else if (filePath) {
      
      const fileStats = fs.statSync(filePath);
      const uploadStream = fs.createReadStream(filePath);
      const contentType = mime.lookup(filePath) || "application/inline";

      await blockBlobClient.uploadStream(uploadStream, fileStats.size, undefined, {
        blobHTTPHeaders: {
          blobContentType: contentType,
        },
      });
    } 
    else {
      throw new Error("Either fileBuffer or filePath must be provided.");
    }
    return blockBlobClient.url;
  } catch (err) {
    console.error("Error uploading file:", err);
    throw new Error("File upload failed.");
  }
}

module.exports = { uploadToBlob };