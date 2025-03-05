const fs = require("fs");
const path = require("path");
const pool = require("../config/db");

const studentFilesUpload = async (req) => {
  const uploadedFiles = []; // Track uploaded files for rollback
  try {
    const { user_id, applicant_id } = req.body;

    if (!user_id || !applicant_id) {
      throw new Error("User ID and Applicant ID are required for file uploads.");
    }

    if (!req.files || Object.keys(req.files).length === 0) {
      throw new Error("No files were uploaded.");
    }

    // Extract file paths
    const filePaths = {
      passport: req.files?.passport?.[0]?.filename
        ? `/uploads/${req.files.passport[0].filename}`
        : null,
      signature: req.files?.signature?.[0]?.filename
        ? `/uploads/${req.files.signature[0].filename}`
        : null,
      xadmitcard: req.files?.xadmitcard?.[0]?.filename
        ? `/uploads/${req.files.xadmitcard[0].filename}`
        : null,
      xiiadmitcard: req.files?.xiiadmitcard?.[0]?.filename
        ? `/uploads/${req.files.xiiadmitcard[0].filename}`
        : null,
      xmarksheet: req.files?.xmarksheet?.[0]?.filename
        ? `/uploads/${req.files.xmarksheet[0].filename}`
        : null,
      xiimarksheet: req.files?.xiimarksheet?.[0]?.filename
        ? `/uploads/${req.files.xiimarksheet[0].filename}`
        : null,
      migration: req.files?.migration?.[0]?.filename
        ? `/uploads/${req.files.migration[0].filename}`
        : null,
      tribe: req.files?.tribe?.[0]?.filename
        ? `/uploads/${req.files.tribe[0].filename}`
        : null,
    };

    // Track uploaded files for rollback
    Object.values(filePaths).forEach((filePath) => {
      if (filePath) uploadedFiles.push(path.join(__dirname, "..", filePath));
    });

    // Save file paths to the database
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

    return { success: true, filePaths };
  } catch (error) {
    console.error("Error uploading files:", error);

    // Rollback: Delete uploaded files
    uploadedFiles.forEach((file) => {
      fs.unlink(file, (err) => {
        if (err) console.error("Error deleting file during rollback:", file, err);
      });
    });

    throw new Error("File upload failed. Please try again later.");
  }
};



// Get files metadata by user ID (returns file info, not actual files)
const getFilesByUserId = async (req, res) => {
  try {
    const { user_id } = req.params;

    const result = await pool.query(
      "SELECT * FROM file_uploads WHERE user_id = $1",
      [user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: "No files found" });
    }

    res.json({ success: "Successfully retrieved files", files: result.rows });
  } catch (err) {
    console.error("Error fetching uploads:", err);
    res.status(500).json({ success: false, error: "Internal Server Error" });
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

    // Construct file paths
    const filePaths = {
      passport_path: passport ? path.join(__dirname, "..", "uploads", passport) : null,
      signature_path: signature ? path.join(__dirname, "..", "uploads", signature) : null,
      tribe_path: tribe ? path.join(__dirname, "..", "uploads", tribe) : null,
      xadmitcard_path: xadmitcard ? path.join(__dirname, "..", "uploads", xadmitcard) : null,
      xiiadmitcard_path: xiiadmitcard ? path.join(__dirname, "..", "uploads", xiiadmitcard) : null,
      xmarksheet_path: xmarksheet ? path.join(__dirname, "..", "uploads", xmarksheet) : null,
      xiimarksheet_path: xiimarksheet ? path.join(__dirname, "..", "uploads", xiimarksheet) : null,
      migration_path: migration ? path.join(__dirname, "..", "uploads", migration) : null,
    };

    // Check if files exist and generate URLs
    const files = {};
    for (const [key, filePath] of Object.entries(filePaths)) {
      if (filePath && fs.existsSync(filePath)) {
        files[key.replace("_path", "_url")] = `uploads/${path.basename(filePath)}`;
      }
    }

    if (Object.keys(files).length === 0) {
      return res.status(404).json({ error: "Files do not exist on the server" });
    }

    res.status(200).json({
      message: "Successfully retrieved files",
      files,
    });
  } catch (error) {
    console.error("Error fetching files:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const uploadFacultyFiles = async (req, res) => {
  try {
    const { faculty_id } = req.body;

    if (!faculty_id) {
      return res.status(400).json({ error: "Faculty ID is required." });
    }

    // Ensure files are present
    if (!req.files || !req.files.profile) {
      return res.status(400).json({ error: "Profile picture is required." });
    }

    // Extract file paths
    const profilePicturePath = req.files.profile[0]?.filename
      ? `/uploads/facultyPhoto/${req.files.profile[0].filename}`
      : null;

    if (!profilePicturePath) {
      return res.status(400).json({ error: "Failed to process the profile picture." });
    }

    // Save file paths to the database
    const query = `
      UPDATE faculty
      SET profile_picture = $1
      WHERE faculty_id = $2
    `;
    await pool.query(query, [profilePicturePath, faculty_id]);

    res.status(201).json({
      success: "Profile picture uploaded successfully.",
      filePaths: { profile_picture: profilePicturePath },
    });
  } catch (error) {
    console.error("Error uploading files:", error);
    res.status(500).json({ error: "File upload failed. Please try again later." });
  }
};


// Retrieve specific files securely for a given faculty member
const getFacultyFiles = async (req, res) => {
  try {
    const { faculty_id } = req.params;
    const requestingUserId = req.user.id;
    const userRole = req.user.role;

    // Validate user access
    if (userRole !== "admin" && userRole !== "staff" && requestingUserId !== faculty_id) {
      return res.status(403).json({ error: "Access denied: You can only access your own files" });
    }

    // Fetch file paths from the database
    const query = `
      SELECT profile_picture
      FROM faculty
      WHERE faculty_id = $1
    `;
    const fileResult = await pool.query(query, [faculty_id]);

    if (fileResult.rows.length === 0) {
      return res.status(404).json({ error: "No files found for the given faculty member" });
    }

    const { profile_picture } = fileResult.rows[0];

    // Construct file path
    const profilePicturePath = profile_picture
      ? path.join(__dirname, "..", profile_picture)
      : null;

    // Check file existence and generate URLs
    const files = {};
    if (profilePicturePath && fs.existsSync(profilePicturePath)) {
      files.profile_picture_url = `/uploads/facultyPhoto/${path.basename(profilePicturePath)}`;
    }

    if (Object.keys(files).length === 0) {
      return res.status(404).json({ error: "No files exist on the server for the given faculty member" });
    }

    res.status(200).json({
      message: "Successfully retrieved files",
      files,
    });
  } catch (error) {
    console.error("Error fetching files:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


module.exports = { studentFilesUpload, getFilesByUserId, getSecureFiles, uploadFacultyFiles, getFacultyFiles };
