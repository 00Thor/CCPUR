// const { BlobServiceClient } = require("@azure/storage-blob");
// const path = require("path");
// const fs = require("fs");

// // Azure Blob Storage configuration
// const blobServiceClient = BlobServiceClient.fromConnectionString(
//   process.env.AZURE_STORAGE_CONNECTION_STRING
// );

// // Function to upload a file to Azure Blob Storage
// async function uploadToBlob(containerName, filePath, fileName) {
//   const containerClient = blobServiceClient.getContainerClient(containerName);

//   // Ensure the container exists
//   await containerClient.createIfNotExists();

//   const blockBlobClient = containerClient.getBlockBlobClient(fileName);
//   const uploadStream = fs.createReadStream(filePath);

//   await blockBlobClient.uploadStream(uploadStream, undefined, undefined, {
//     blobHTTPHeaders: { blobContentType: "application/octet-stream" },
//   });

//   return blockBlobClient.url; // Return the file's URL
// }

// module.exports = { uploadToBlob };


const { BlobServiceClient } = require("@azure/storage-blob");
require("dotenv").config();

const blobServiceClient = BlobServiceClient.fromConnectionString(
  process.env.AZURE_STORAGE_CONNECTION_STRING
);

async function uploadToBlob(containerName, filePath = null, blobName, fileBuffer = null, fileSize = 0) {
  try {
    const containerClient = blobServiceClient.getContainerClient(containerName);

    // Ensure the container exists
    await containerClient.createIfNotExists();
    console.log(`Container '${containerName}' created or verified.`);

    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    // Upload directly from buffer if provided
    if (fileBuffer && fileSize > 0) {
      console.log(`Uploading file '${blobName}' from buffer.`);
      
      // Infer MIME type from the file name
      const mime = require("mime");
      const contentType = mime.getType(blobName);

      await blockBlobClient.upload(fileBuffer, fileSize, {
        blobHTTPHeaders: {
          blobContentType: contentType, // Set the correct MIME type
        },
      });
    } 
    // Upload from file path if provided
    else if (filePath) {
      const fs = require("fs");
      const fileStats = fs.statSync(filePath);
      const uploadStream = fs.createReadStream(filePath);

      // Infer MIME type from the file name
      const mime = require("mime");
      const contentType = mime.getType(filePath);

      await blockBlobClient.uploadStream(uploadStream, fileStats.size, undefined, {
        blobHTTPHeaders: {
          blobContentType: contentType, // Set the correct MIME type
        },
      });
    } 
    else {
      throw new Error("Either fileBuffer or filePath must be provided.");
    }

    console.log(`File '${blobName}' uploaded successfully.`);
    return blockBlobClient.url;
  } catch (err) {
    console.error("Error uploading file:", err.message);
    throw new Error("File upload failed.");
  }
}

module.exports = { uploadToBlob };