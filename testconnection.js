// require("dotenv").config(); // Load environment variables
// const { BlobServiceClient } = require("@azure/storage-blob");
// const { v4: uuidv4 } = require("uuid");

// // Azure Blob Storage configuration
// const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
// const CONTAINER_NAME = "uploads"; // Azure Blob container name

// // Initialize Azure Blob Service Client
// const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
// const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);

// // Helper function to upload files to Azure Blob Storage
// const uploadToAzure = async (fileBuffer, fileName, contentType) => {
//   const blobName = `${uuidv4()}-${fileName}`;
//   const blockBlobClient = containerClient.getBlockBlobClient(blobName);

//   // Ensure the container exists
//   await containerClient.createIfNotExists({ access: "container" });

//   // Upload the file
//   await blockBlobClient.uploadData(fileBuffer, {
//     blobHTTPHeaders: { blobContentType: contentType },
//   });

//   return { blobName, fileUrl: blockBlobClient.url };
// };

// // Test Azure upload
// (async () => {
//   try {
//     const fileBuffer = Buffer.from("Test file content");
//     const fileName = "test.pdf";
//     const contentType = "application/pdf";

//     const result = await uploadToAzure(fileBuffer, fileName, contentType);
//     console.log("Azure upload test successful:", result);
//   } catch (error) {
//     console.error("Azure upload test failed:", error);
//   }
// })();
const crypto = require("crypto");

const encryptionKey = crypto.randomBytes(32).toString("hex"); // 256-bit key
console.log("Your Secure Encryption Key:", encryptionKey);
