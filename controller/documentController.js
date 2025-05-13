const { BlobServiceClient } = require("@azure/storage-blob");
const { v4: uuidv4 } = require("uuid");
const db = require("../config/db"); 
require("dotenv").config();
const jwt = require("jsonwebtoken");
const pool = require("../config/db"); // Ensure the path to your db config is correct

// Azure Blob Storage configuration
const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
const CONTAINER_NAME = "documentsfromadmin"; // Azure Blob container name

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

// Admin login
const bcrypt = require("bcrypt");
const loginAdmin = async (req, res) => {
  try {
    const { name, password } = req.body;

    // Validate request body
    if (!name || !password) {
      return res.status(400).json({ error: "Name and password are required." });
    }

    // Query the database for the admin's credentials
    const query = "SELECT name, password, role FROM users WHERE name = $1 AND role = $2";
    const result = await pool.query(query, [name, "admin"]);

    // Check if the admin exists
    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid name or password." });
    }

    const admin = result.rows[0];

    // Validate the password using bcrypt
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid name or password." });
    }

    // Generate a JWT for the admin
    const token = jwt.sign(
      { name: admin.name, role: admin.role }, // Payload
      process.env.JWT_SECRET, // Secret key
      { expiresIn: "6h" } // Expiration time
    );

    // Respond with the token
    res.status(200).json({ message: "Login successful.", token });
  } catch (error) {
    console.error("Error in loginAdmin:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


//upload document
const uploadDocument = async (req, res) => {
  try {
    const { title, description } = req.body;
    const pdf = req.file;

    if (!pdf) {
      console.error("No file uploaded.");
      return res.status(400).json({ error: "No PDF file uploaded" });
    }

    if (pdf.mimetype !== "application/pdf") {
      console.error("Invalid file type:", pdf.mimetype);
      return res.status(400).json({ error: "Only PDF files are allowed" });
    }

    const { blobName, fileUrl } = await uploadToAzure(pdf.buffer, pdf.originalname, pdf.mimetype);
    console.log("File uploaded to Azure:", fileUrl);

    const query = "INSERT INTO documents (title, file_path, description) VALUES ($1, $2, $3) RETURNING *";
    const values = [title, blobName, description];
    const result = await db.query(query, values);

    res.status(201).json({
      doc_id: result.rows[0].doc_id,
      title,
      description,
      fileUrl,
    });
  } catch (error) {
    console.error("Error in uploadDocument:", error);
    res.status(500).json({ error: "Failed to upload document." });
  }
};

// Get all documents
const getAllDocuments = async (req, res) => {
  try {
    const query = `SELECT doc_id, title, file_path, 
                          TO_CHAR(uploaded_at, 'MM-DD-YYYY HH12:MI AM') AS uploaded_at, 
                          description 
                   FROM documents`;
    const result = await db.query(query);

    if (result.rows.length === 0) {
      return res.status(204).json({ error: "No documents found." });
    }

    const documents = result.rows.map((doc) => ({
      doc_id: doc.doc_id,
      title: doc.title,
      description: doc.description,
      fileUrl: containerClient.getBlockBlobClient(doc.file_path).url,
      uploaded_at: doc.uploaded_at,
    }));

    res.status(200).json(documents);
  } catch (error) {
    console.error("Error fetching documents:", error.message);
    res.status(500).json({ error: "Failed to fetch documents." });
  }
};

// Get a specific document by doc_id
const getSpecificDocument = async (req, res) => {
  try {
    const { doc_id } = req.params;

    if (!doc_id) {
      return res.status(400).json({ error: "Document ID is required." });
    }

    const query = "SELECT file_path FROM documents WHERE doc_id = $1";
    const { rows } = await db.query(query, [doc_id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Document not found." });
    }

    const fileUrl = containerClient.getBlockBlobClient(rows[0].file_path).url;
    res.status(200).json({ fileUrl });
  } catch (error) {
    console.error("Error fetching the document:", error.message);
    res.status(500).json({ error: "Failed to fetch the document." });
  }
};

// Helper function to delete a file from Azure Blob Storage
const deleteFromAzure = async (blobName) => {
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  await blockBlobClient.deleteIfExists();
};

// Delete a specific document by doc_id
const deleteSpecificDocument = async (req, res) => {
  try {
    const { doc_id } = req.params;

    // Fetch file path from the database
    const query = "SELECT file_path FROM documents WHERE doc_id = $1";
    const { rows } = await db.query(query, [doc_id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Document not found." });
    }

    const blobName = rows[0].file_path;

    // Delete file from Azure Blob Storage
    await deleteFromAzure(blobName);

    // Delete database entry
    const deleteQuery = "DELETE FROM documents WHERE doc_id = $1";
    await db.query(deleteQuery, [doc_id]);

    res.status(200).json({ message: "Document deleted successfully." });
  } catch (error) {
    console.error("Error deleting document:", error.message);
    res.status(500).json({ error: "Failed to delete document." });
  }
};

module.exports = {
  loginAdmin,
  uploadDocument,
  getAllDocuments,
  getSpecificDocument,
  deleteSpecificDocument,
};
