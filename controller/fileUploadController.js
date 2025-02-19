const fs = require("fs");
const path = require("path");
const pool = require("../config/db");

// Upload files and save their paths in the database
const uploadFiles = async (req, res) => {
  try {
    const { user_id, applicant_id, student_id } = req.body;

    if (!user_id || !applicant_id || !student_id) {
      return res
        .status(400)
        .json({ error: "User ID, Applicant ID, and Student ID are required." });
    }

    // Ensure files are present
    if (!req.files) {
      return res.status(400).json({ error: "No files were uploaded." });
    }

    // Extract file paths
    const filePaths = {
      passport_path: req.files?.passport?.[0]?.filename
        ? `/uploads/${req.files.passport[0].filename}`
        : null,
      signature_path: req.files?.signature?.[0]?.filename
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

    // Save file paths to the database
    await pool.query(
      `
      INSERT INTO file_uploads 
      (user_id, applicant_id, student_id, passport_path, signature_path, xadmitcard, xiiadmitcard, xmarksheet, xiimarksheet, migration, tribe)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `,
      [
        user_id,
        applicant_id,
        student_id,
        filePaths.passport_path,
        filePaths.signature_path,
        filePaths.xadmitcard,
        filePaths.xiiadmitcard,
        filePaths.xmarksheet,
        filePaths.xiimarksheet,
        filePaths.migration,
        filePaths.tribe,
      ]
    );

    res.status(201).json({ success: "Files uploaded successfully.", filePaths });
  } catch (error) {
    console.error("Error uploading files:", error);
    res.status(500).json({ error: "File upload failed. Please try again later." });
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
    const requestingUserId = req.user.id;
    const userRole = req.user.role;

    // Validate user access
    if (userRole !== "admin" && userRole !== "staff" && requestingUserId !== user_id) {
      return res.status(403).json({ error: "Access denied: You can only access your own files" });
    }

    // Fetch file paths from the database
    const query = `
      SELECT passport_path, signature_path, tribe, xadmitcard, xiiadmitcard, xmarksheet, xiimarksheet, migration
      FROM file_uploads 
      WHERE user_id = $1
    `;
    const fileResult = await pool.query(query, [user_id]);

    if (fileResult.rows.length === 0) {
      return res.status(404).json({ error: "Files not found for the given user" });
    }

    const { passport_path, signature_path, tribe, xadmitcard, xiiadmitcard, xiimarksheet, xmarksheet, migration } = fileResult.rows[0];

    // Construct file paths
    const filePaths = {
      passport_path: passport_path ? path.join(__dirname, "..", passport_path) : null,
      signature_path: signature_path ? path.join(__dirname, "..", signature_path) : null,
      tribe_path: tribe ? path.join(__dirname, "..", tribe) : null,
      xadmitcard_path: xadmitcard ? path.join(__dirname, "..", xadmitcard) : null,
      xiiadmitcard_path: xiiadmitcard ? path.join(__dirname, "..", xiiadmitcard) : null,
      xmarksheet_path: xmarksheet ? path.join(__dirname, "..", xmarksheet) : null,
      xiimarksheet_path: xiimarksheet ? path.join(__dirname, "..", xiimarksheet) : null,
      migration_path: migration ? path.join(__dirname, "..", migration) : null,
      
    };

    // Check file existence and generate URLs
    const files = {};
    for (const [key, filePath] of Object.entries(filePaths)) {
      if (filePath && fs.existsSync(filePath)) {
        files[key.replace("_path", "_url")] = `/uploads/${path.basename(filePath)}`;
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

module.exports = { uploadFiles, getFilesByUserId, getSecureFiles };
