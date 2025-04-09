const fs = require("fs");
const path = require("path");
const pool = require("../config/db");

const studentFilesUpload = async (req, client) => {
  const uploadedFiles = []; // Track uploaded files for rollback
  try {
    const { user_id, application_id } = req.body;

    if (!user_id || !application_id) {
      throw new Error("User ID and Application ID are required for file uploads.");
    }

    if (!req.files || Object.keys(req.files).length === 0) {
      throw new Error("No files were uploaded.");
    }

    // Extract file paths
    const filePaths = {
      passport: req.files?.passport?.[0]?.filename
        ? path.resolve(__dirname, "..", "uploads", req.files.passport[0].filename)
        : null,
      signature: req.files?.signature?.[0]?.filename
        ? path.resolve(__dirname, "..", "uploads", req.files.signature[0].filename)
        : null,
      xadmitcard: req.files?.xadmitcard?.[0]?.filename
        ? path.resolve(__dirname, "..", "uploads", req.files.xadmitcard[0].filename)
        : null,
      xiiadmitcard: req.files?.xiiadmitcard?.[0]?.filename
        ? path.resolve(__dirname, "..", "uploads", req.files.xiiadmitcard[0].filename)
        : null,
      xmarksheet: req.files?.xmarksheet?.[0]?.filename
        ? path.resolve(__dirname, "..", "uploads", req.files.xmarksheet[0].filename)
        : null,
      xiimarksheet: req.files?.xiimarksheet?.[0]?.filename
        ? path.resolve(__dirname, "..", "uploads", req.files.xiimarksheet[0].filename)
        : null,
      migration: req.files?.migration?.[0]?.filename
        ? path.resolve(__dirname, "..", "uploads", req.files.migration[0].filename)
        : null,
      tribe: req.files?.tribe?.[0]?.filename
        ? path.resolve(__dirname, "..", "uploads", req.files.tribe[0].filename)
        : null,
    };

    // Track uploaded files for rollback
    Object.values(filePaths).forEach((filePath) => {
      if (filePath) uploadedFiles.push(filePath);
    });

    // Ensure critical files are uploaded
    if (!filePaths.passport || !filePaths.signature) {
      throw new Error("Passport and signature files are mandatory.");
    }

    // Save file paths to the database using the provided client
    await client.query(
      `
      INSERT INTO file_uploads 
      (user_id, application_id, passport, signature, xadmitcard, xiiadmitcard, xmarksheet, xiimarksheet, migration, tribe)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `,
      [
        user_id,
        application_id,
        filePaths.passport,
        filePaths.signature,
        filePaths.xadmitcard,
        filePaths.xiiadmitcard,
        filePaths.xmarksheet,
        filePaths.xiimarksheet,
        filePaths.migration,
        filePaths.tribe,
      ]
    );

    return { success: true, filePaths };
  } catch (error) {
    console.error("Error uploading files:", { error: error.message, stack: error.stack });

    // Rollback: Delete uploaded files
    uploadedFiles.forEach((file) => {
      fs.unlink(file, (err) => {
        if (err) {
          console.error("Error deleting file during rollback:", file, err);
        }
      });
    });

    throw new Error("File upload failed. Please try again later.");
  }
};

// Retrieve specific files securely for a given user
const getSecureFiles = async (req, res) => {
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

    // Ensure files include extensions
    const fileNames = {
      passport,
      signature,
      tribe,
      xadmitcard,
      xiiadmitcard,
      xmarksheet,
      xiimarksheet,
      migration,
    };

    const SERVER_URL = process.env.SERVER_URL || "http://localhost:5000";

    const files = Object.entries(fileNames).reduce((acc, [key, fileName]) => {
      if (fileName) {
        // If your files are saved inside "uploads/faculty" or similar
        const fileUrl = `${SERVER_URL}/uploads/${fileName}`;
        acc[`${key}_url`] = fileUrl;
      } else {
        acc[`${key}_url`] = null;
      }
      return acc;
    }, {});
    

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
    const { user_id, updates } = req.body;

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
    const containerName = "student-files"; // Ensure this matches your container name

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
  getSecureFiles,
  updateStudentFiles,
  deleteStudentFiles
};

// *************** For GOOGLE CLOUD SERVICE *********************************//

// File upload to Google Cloud Service
/*const studentFilesUpload = async (req, res) => {
  try {
    const { user_id, applicant_id } = req.body;

    // Validate required fields
    if (!user_id || !applicant_id) {
      return res
        .status(400)
        .json({ error: "User ID and Applicant ID are required." });
    }

    // Check for uploaded files
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({ error: "No files were uploaded." });
    }

    // Extract file URLs (from middleware-uploaded files)
    const filePaths = {
      passport: req.uploadedFiles.passport || null,
      signature: req.uploadedFiles.signature || null,
      xadmitcard: req.uploadedFiles.xadmitcard || null,
      xiiadmitcard: req.uploadedFiles.xiiadmitcard || null,
      xmarksheet: req.uploadedFiles.xmarksheet || null,
      xiimarksheet: req.uploadedFiles.xiimarksheet || null,
      migration: req.uploadedFiles.migration || null,
      tribe: req.uploadedFiles.tribe || null,
    };

    // Save file information to the database
    await pool.query(
      `
      INSERT INTO file_uploads 
      (user_id, applicant_id, passport, signature, xadmitcard, xiiadmitcard, xmarksheet, xiimarksheet, migration, tribe)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `,
      [
        user_id,
        applicant_id,
        filePaths.passport,
        filePaths.signature,
        filePaths.xadmitcard,
        filePaths.xiiadmitcard,
        filePaths.xmarksheet,
        filePaths.xiimarksheet,
        filePaths.migration,
        filePaths.tribe,
      ]
    );

    // Return success response
    res.status(200).json({
      success: true,
      message: "Files uploaded and saved successfully.",
      filePaths,
    });
  } catch (error) {
    console.error("Error in studentFilesUpload controller:", error);

    // Send error response
    res.status(500).json({
      success: false,
      error: "An error occurred while uploading files. Please try again.",
    });
  }
}; */
// Get secure files for Google Cloud Service
 /* const getSecureFiles = async (req, res) => {
  try {
    const { user_id } = req.params;

    // Fetch file URLs from the database
    const query = `
      SELECT passport, signature, tribe, xadmitcard, xiiadmitcard, xmarksheet, xiimarksheet, migration
      FROM file_uploads 
      WHERE user_id = $1
    `;
    const fileResult = await pool.query(query, [user_id]);

    if (fileResult.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Files not found for the given user." });
    }

    const files = fileResult.rows[0];

    // Return the file URLs directly (stored from GCS upload)
    res.status(200).json({
      message: "Successfully retrieved files",
      files,
    });
  } catch (error) {
    console.error("Error fetching files:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}; */

// Google Cloud Storage upload faculty files
/*const uploadFacultyFiles = async (req, res) => {
  try {
    const { faculty_id } = req.body;

    if (!faculty_id) {
      return res.status(400).json({ error: "Faculty ID is required." });
    }

    // Extract uploaded file URLs from middleware
    const profilePictureUrl = req.uploadedFiles?.profile_picture || null;

    if (!profilePictureUrl) {
      return res.status(400).json({ error: "Profile picture upload failed." });
    }

    // Save the file URL in the database
    const query = `
      INSERT INTO faculty_files (faculty_id, profile_photos)
      VALUES ($1, ARRAY[$2])
      ON CONFLICT (faculty_id)
      DO UPDATE SET
        profile_photos = array_append(faculty_files.profile_photos, $2)
    `;
    const values = [faculty_id, profilePictureUrl];
    await pool.query(query, values);

    res.status(201).json({
      success: "Profile picture uploaded successfully.",
      filePaths: { profile_picture: profilePictureUrl },
    });
  } catch (error) {
    console.error("Error uploading files:", error);
    res.status(500).json({ error: "File upload failed. Please try again later." });
  }
};

//Get faculty files from Google Cloud Storage
const getFacultyFiles = async (req, res) => {
  try {
    const { faculty_id } = req.params;
    const requestingUserId = req.user.id;
    const userRole = req.user.role;

    // Validate user access
    if (
      userRole !== "admin" &&
      userRole !== "staff" &&
      requestingUserId !== faculty_id
    ) {
      return res
        .status(403)
        .json({ error: "Access denied: You can only access your own files." });
    }

    // Fetch file URLs from the database
    const query = `
      SELECT profile_photos, books_published, seminars_attended
      FROM faculty_files
      WHERE faculty_id = $1
    `;
    const result = await pool.query(query, [faculty_id]);

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "No files found for the given faculty member." });
    }

    const { profile_photos, books_published, seminars_attended } = result.rows[0];

    // Construct file URL response
    const files = {
      profile_photos: profile_photos || [],
      books_published: books_published || [],
      seminars_attended: seminars_attended || [],
    };

    res.status(200).json({
      message: "Successfully retrieved files.",
      files,
    });
  } catch (error) {
    console.error("Error fetching files:", error);
    res.status(500).json({ error: "Internal Server Error." });
  }
};
 */

// ************************** FOR AZURE BLOB STORAGE *********************************** //
/*
const { uploadToBlob } = require("./azureBlobService");

const studentFilesUpload = async (req) => {
  try {
    const { user_id, applicant_id } = req.body;

    if (!user_id || !applicant_id) {
      throw new Error("User ID and Applicant ID are required for file uploads.");
    }

    if (!req.files || Object.keys(req.files).length === 0) {
      throw new Error("No files were uploaded.");
    }

    const containerName = "student-files";
    const fileUrls = {};

    // Upload files to Azure Blob Storage
    for (const [key, files] of Object.entries(req.files)) {
      if (files?.[0]?.path) {
        const filePath = files[0].path;
        const fileName = path.basename(filePath);
        fileUrls[key] = await uploadToBlob(containerName, filePath, fileName);
      }
    }

    // Save file URLs to the database
    await pool.query(
      `
      INSERT INTO file_uploads 
      (user_id, applicant_id, passport, signature, xadmitcard, xiiadmitcard, xmarksheet, xiimarksheet, migration, tribe)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `,
      [
        user_id,
        applicant_id,
        fileUrls.passport || null,
        fileUrls.signature || null,
        fileUrls.xadmitcard || null,
        fileUrls.xiiadmitcard || null,
        fileUrls.xmarksheet || null,
        fileUrls.xiimarksheet || null,
        fileUrls.migration || null,
        fileUrls.tribe || null,
      ]
    );

    return { success: true, fileUrls };
  } catch (error) {
    console.error("Error uploading files:", error);
    throw new Error("File upload failed. Please try again later.");
  }
}; 

// student files retreival
const getSecureFiles = async (req, res) => {
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
      return res.status(404).json({ error: "Files not found for the given user" });
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

    const fileNames = {
      passport,
      signature,
      tribe,
      xadmitcard,
      xiiadmitcard,
      xmarksheet,
      xiimarksheet,
      migration,
    };

    // Azure Blob Storage configuration
    const blobServiceClient = BlobServiceClient.fromConnectionString(
      process.env.AZURE_STORAGE_CONNECTION_STRING
    );
    const containerName = "student-files"; // Name of your container
    const containerClient = blobServiceClient.getContainerClient(containerName);

    const generateSasToken = async (blobName) => {
      const blobClient = containerClient.getBlobClient(blobName);
      const sasToken = await blobClient.generateSasUrl({
        permissions: "r", // Read-only access
        expiresOn: new Date(new Date().valueOf() + 3600 * 1000), // 1 hour
      });
      return sasToken;
    };

    // Generate SAS tokens for available files
    const files = {};
    for (const [key, fileName] of Object.entries(fileNames)) {
      if (fileName) {
        try {
          files[`${key}_url`] = await generateSasToken(fileName);
        } catch (error) {
          console.error(`Error generating SAS token for ${key}:`, error);
          files[`${key}_url`] = null; // Provide null if token generation fails
        }
      } else {
        files[`${key}_url`] = null;
      }
    }

    return res.status(200).json({
      message: "Successfully retrieved files",
      files,
    });
  } catch (error) {
    console.error("Error fetching files:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const { BlobServiceClient } = require("@azure/storage-blob");
const path = require("path");

const uploadFacultyFiles = async (req, res) => {
  try {
    const { faculty_id } = req.body;

    if (!faculty_id) {
      return res.status(400).json({ error: "Faculty ID is required." });
    }

    if (!req.files || !req.files.profile) {
      return res.status(400).json({ error: "Profile picture is required." });
    }

    // Define container name and file path
    const containerName = "faculty-photos";
    const profilePicturePath = req.files.profile[0]?.path;
    const profilePictureName = path.basename(profilePicturePath);

    // Initialize Azure Blob Service Client
    const blobServiceClient = BlobServiceClient.fromConnectionString(
      process.env.AZURE_STORAGE_CONNECTION_STRING
    );
    const containerClient = blobServiceClient.getContainerClient(containerName);

    // Upload file to Azure Blob Storage
    const blockBlobClient = containerClient.getBlockBlobClient(profilePictureName);
    const uploadBlobResponse = await blockBlobClient.uploadFile(profilePicturePath);

    if (!uploadBlobResponse._response.status || uploadBlobResponse._response.status !== 201) {
      return res.status(500).json({ error: "Failed to upload profile picture to Azure Blob Storage." });
    }

    // Generate URL for the uploaded file
    const profilePictureUrl = blockBlobClient.url;

    // Save the file URL to the database
    const query = `
      UPDATE faculty
      SET profile_picture = $1
      WHERE faculty_id = $2
    `;
    await pool.query(query, [profilePictureUrl, faculty_id]);

    res.status(201).json({
      success: "Profile picture uploaded successfully.",
      fileUrl: profilePictureUrl,
    });
  } catch (error) {
    console.error("Error uploading files:", error);
    res.status(500).json({ error: "File upload failed. Please try again later." });
  }
};
const getFacultyFiles = async (req, res) => {
  try {
    const { faculty_id } = req.params;
    const requestingUserId = req.user.id;
    const userRole = req.user.role;

    // Validate user access
    if (
      userRole !== "admin" &&
      userRole !== "staff" &&
      requestingUserId !== faculty_id
    ) {
      return res
        .status(403)
        .json({ error: "Access denied: You can only access your own files." });
    }

    // Fetch file paths from the database
    const query = `
      SELECT profile_picture
      FROM faculty
      WHERE faculty_id = $1
    `;
    const fileResult = await pool.query(query, [faculty_id]);

    if (fileResult.rows.length === 0 || !fileResult.rows[0].profile_picture) {
      return res.status(404).json({ error: "No files found for the given faculty member." });
    }

    const profilePictureUrl = fileResult.rows[0].profile_picture;

    res.status(200).json({
      message: "Successfully retrieved files.",
      files: { profile_picture_url: profilePictureUrl },
    });
  } catch (error) {
    console.error("Error fetching files:", error);
    res.status(500).json({ error: "Internal Server Error." });
  }
};

*/

