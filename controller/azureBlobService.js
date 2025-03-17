const { BlobServiceClient } = require("@azure/storage-blob");
const path = require("path");
const fs = require("fs");

// Azure Blob Storage configuration
const blobServiceClient = BlobServiceClient.fromConnectionString(
  process.env.AZURE_STORAGE_CONNECTION_STRING
);

// Function to upload a file to Azure Blob Storage
async function uploadToBlob(containerName, filePath, fileName) {
  const containerClient = blobServiceClient.getContainerClient(containerName);

  // Ensure the container exists
  await containerClient.createIfNotExists();

  const blockBlobClient = containerClient.getBlockBlobClient(fileName);
  const uploadStream = fs.createReadStream(filePath);

  await blockBlobClient.uploadStream(uploadStream, undefined, undefined, {
    blobHTTPHeaders: { blobContentType: "application/octet-stream" },
  });

  return blockBlobClient.url; // Return the file's URL
}

module.exports = { uploadToBlob };
