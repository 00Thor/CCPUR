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

    // Use environment variable or fallback for local development
    const SERVER_URL =
      process.env.SERVER_URL || "http://localhost:5000/uploads/";

    // Build file URLs dynamically
    const files = Object.entries(fileNames).reduce((acc, [key, fileName]) => {
      if (fileName) {
        const filePath = path.join(__dirname, "..", "uploads", fileName);
        const fileBaseName = path.basename(filePath); // Extract only the file name
        acc[`${key}_url`] = `${SERVER_URL}${fileBaseName}`; // Append file name to SERVER_URL
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

//Upload faculty files

const uploadFacultyFiles = async (req, res) => {
  try {
    const { faculty_id } = req.body;

    if (!faculty_id) {
      return res.status(400).json({ error: "Faculty ID is required." });
    }

    // Ensure files are present
    const files = req.files || {};
    if (!files.profile && !files.book_published && !files.seminar_attended) {
      return res
        .status(400)
        .json({ error: "At least one file type must be uploaded." });
    }

    // Extract file paths
    const profilePictures = (files.profile || []).map(
      (file) => `/uploads/facultyPhoto/${file.filename}`
    );
    const booksPublished = (files.book_published || []).map(
      (file) => `/uploads/facultyBooks/${file.filename}`
    );
    const seminarsAttended = (files.seminar_attended || []).map(
      (file) => `/uploads/facultySeminars/${file.filename}`
    );

    // Update the faculty_files table with new paths
    const query = `
      INSERT INTO faculty_files (faculty_id, profile_photos, books_published, seminars_attended)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (faculty_id)
      DO UPDATE SET
        profile_photos = faculty_files.profile_photos || EXCLUDED.profile_photos,
        books_published = faculty_files.books_published || EXCLUDED.books_published,
        seminars_attended = faculty_files.seminars_attended || EXCLUDED.seminars_attended
      RETURNING *
    `;
    const values = [faculty_id, profilePictures, booksPublished, seminarsAttended];

    const result = await pool.query(query, values);

    res.status(201).json({
      success: "Files uploaded successfully.",
      updatedFiles: result.rows[0],
    });
  } catch (error) {
    console.error("Error uploading files:", error);
    res
      .status(500)
      .json({ error: "File upload failed. Please try again later." });
  }
};

// Fetch Faculty Files
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

    // Generate URLs for files
    const files = {
      profile_photos: profile_photos.map(
        (path) => `/uploads/facultyPhoto/${path.split("/").pop()}`
      ),
      books_published: books_published.map(
        (path) => `/uploads/facultyBooks/${path.split("/").pop()}`
      ),
      seminars_attended: seminars_attended.map(
        (path) => `/uploads/facultySeminars/${path.split("/").pop()}`
      ),
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

module.exports = {
  studentFilesUpload,
  getSecureFiles,
  uploadFacultyFiles,
  getFacultyFiles,
};
