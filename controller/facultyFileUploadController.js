// const {
//   BlobServiceClient
// } = require("@azure/storage-blob");
// const path = require("path");
// const pool = require("../config/db");
// require("dotenv").config();

// const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING; // Ensure this is set in your environment
// const CONTAINER_NAME = "faculty-files"; // Your blob container name

// // Upload faculty files
// const uploadFacultyFiles = async (client, faculty_id, files) => {
//   if (!faculty_id) throw new Error("No faculty ID provided.");
//   if (!files || files.length === 0) throw new Error("No files uploaded.");

//   // Define field mappings
//   const fieldMapping = {
//     profile_photos: "profile_photos",
//     books_published_images: "books_published",
//     books_published_pdfs: "books_published",
//     seminars_attended_images: "seminars_attended",
//     seminars_attended_pdfs: "seminars_attended",
//   };

//   let localClient = client;
//   let transactionStarted = false;

//   try {
//     // Use the provided client or establish a new connection
//     if (!client) {
//       localClient = await pool.connect();
//       transactionStarted = true;
//     }

//     // Begin transaction if managed here
//     if (transactionStarted) {
//       await localClient.query("BEGIN");
//     }

//     // Insert each file as a separate row in the database
//     for (const file of files) {
//       const fileType = fieldMapping[file.fieldname];
//       if (!fileType) continue;

//       const filePath = `/uploads/faculty/${file.filename}`;
//       const query = `
//         INSERT INTO faculty_files (faculty_id, file_type, file_path)
//         VALUES ($1, $2, $3)
//       `;
//       await localClient.query(query, [faculty_id, fileType, filePath]);
//     }

//     // Commit the transaction if managed here
//     if (transactionStarted) {
//       await localClient.query("COMMIT");
//     }

//     return { message: "Files uploaded successfully." };
//   } catch (error) {
//     // Rollback transaction if managed here
//     if (transactionStarted) {
//       await localClient.query("ROLLBACK");
//     }

//     console.error("Error saving faculty files:", error.message);
//     throw new Error(`Failed to save faculty files: ${error.message}`);
//   } finally {
//     // Release the client if it was created here
//     if (transactionStarted) {
//       localClient.release();
//     }
//   }
// };


//   // Fetch Faculty Files
//   const getFacultyFiles = async (req, res) => {
//     try {
//       const { faculty_id } = req.params;
//       const requestingUserId = req.user.id;
//       const userRole = req.user.role;
  
//       // Validate user access
//       if (
//         userRole !== "admin" &&
//         userRole !== "staff" &&
//         requestingUserId !== faculty_id
//       ) {
//         return res
//           .status(403)
//           .json({ error: "Access denied: You can only access your own files." });
//       }
  
//       // Fetch file paths from the database
//       const query = `
//         SELECT profile_photos, books_published, seminars_attended
//         FROM faculty_files
//         WHERE faculty_id = $1
//       `;
//       const result = await pool.query(query, [faculty_id]);
  
//       if (result.rows.length === 0) {
//         return res
//           .status(404)
//           .json({ error: "No files found for the given faculty member." });
//       }
  
//       const { profile_photos, books_published, seminars_attended } = result.rows[0];
  
//       // Generate URLs for files
//       const files = {
//         profile_photos: profile_photos.map(
//           (path) => `/uploads/facultyPhoto/${path.split("/").pop()}`
//         ),
//         books_published: books_published.map(
//           (path) => `/uploads/facultyBooks/${path.split("/").pop()}`
//         ),
//         seminars_attended: seminars_attended.map(
//           (path) => `/uploads/facultySeminars/${path.split("/").pop()}`
//         ),
//       };
  
//       res.status(200).json({
//         message: "Successfully retrieved files.",
//         files,
//       });
//     } catch (error) {
//       console.error("Error fetching files:", error);
//       res.status(500).json({ error: "Internal Server Error." });
//     }
//   };
const { BlobServiceClient } = require("@azure/storage-blob");
const pool = require("../config/db");
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
const uploadFacultyFiles = async (client, faculty_id, files) => {
  if (!faculty_id) throw new Error("No faculty ID provided.");
  if (!files || files.length === 0) throw new Error("No files uploaded.");

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

    for (const file of files) {
      const fileType = fieldMapping[file.fieldname];
      if (!fileType) continue;

      // Upload file to Azure Blob Storage
      const blobName = `faculty/${faculty_id}/${file.originalname}`;
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);
      await blockBlobClient.uploadFile(file.path);

      const blobUrl = blockBlobClient.url;

      // Insert file details into the database
      const query = `
        INSERT INTO faculty_files (faculty_id, file_type, file_path)
        VALUES ($1, $2, $3)
      `;
      await localClient.query(query, [faculty_id, fileType, blobUrl]);
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

    // Fetch file URLs from the database
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

  // Update Facultu Files
const updateFacultyFiles = async (req, res) => {
    try {
      const { faculty_id } = req.params;
      const { fileType } = req.body; // e.g., "profile_photos", "books_published", "seminars_attended"
  
      if (!faculty_id) {
        return res.status(400).json({ error: "Faculty ID is required." });
      }
  
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: "No files provided for upload." });
      }
  
      if (!["profile_photos", "books_published", "seminars_attended"].includes(fileType)) {
        return res.status(400).json({ error: "Invalid file type provided." });
      }
  
      const containerName = "faculty-files";
      const blobServiceClient = BlobServiceClient.fromConnectionString(
        process.env.AZURE_STORAGE_CONNECTION_STRING
      );
      const containerClient = blobServiceClient.getContainerClient(containerName);
  
      const uploadedUrls = [];
  
      for (const file of req.files) {
        const fileName = `${uuidv4()}_${file.originalname}`;
        const blockBlobClient = containerClient.getBlockBlobClient(fileName);
  
        // Upload file to Azure Blob Storage
        await blockBlobClient.uploadFile(file.path);
  
        // Add URL to list
        uploadedUrls.push(blockBlobClient.url);
      }
  
      // Update the database
      const query = `
        UPDATE faculty_files 
        SET ${fileType} = array_cat(${fileType}, $1) 
        WHERE faculty_id = $2
        RETURNING *;
      `;
  
      const result = await pool.query(query, [uploadedUrls, faculty_id]);
  
      if (result.rowCount === 0) {
        return res.status(404).json({ error: "Faculty not found." });
      }
  
      res.status(200).json({
        success: "Files updated successfully.",
        updatedFiles: result.rows[0],
      });
    } catch (error) {
      console.error("Error updating files:", error);
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