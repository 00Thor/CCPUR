const { insertFacultyAcademicRecords } = require("./facultyAcademicRecordsController");
const { newFaculty } = require("./basicFacultyController");
const { uploadFacultyFiles } = require("./facultyFileUploadController");
const { createCommitteeRoles } = require("./committeeRolesController");

const handleFacultyData = async (req, res) => {
    try {
        // Validate and parse facultyData
        if (!req.body.facultyData) {
            return res.status(400).json({ success: false, message: "facultyData is required." });
        }

        let facultyData;
        try {
            facultyData = JSON.parse(req.body.facultyData);
        } catch (err) {
            return res.status(400).json({ success: false, message: "Invalid JSON in facultyData." });
        }

        if (!facultyData || typeof facultyData !== "object") {
            return res.status(400).json({ success: false, message: "facultyData must be an object." });
        }

        const results = [];
        const faculties = Array.isArray(facultyData) ? facultyData : [facultyData];

        for (const faculty of faculties) {
            try {
                // Create a new faculty entry
                const createdFaculty = await newFaculty(faculty);
                
                console.log("Faculty ID:", faculty.id); // Add before calling insertFacultyAcademicRecords

                // Insert academic records
                await insertFacultyAcademicRecords(
                    { body: faculty },
                    { params: { faculty_id: createdFaculty.id } }
                );

                // Create committee roles
                await createCommitteeRoles(
                    { body: faculty.CommitteeIDAndRole },
                    { params: { faculty_id: createdFaculty.id } }
                );

                // Upload files (handle file upload errors separately)
                if (req.files) {
                    await uploadFacultyFiles(faculty, req.files);
                }

                results.push({ faculty: createdFaculty, success: true });
            } catch (error) {
                console.error(`Error processing faculty: ${faculty.name}`, error);
                results.push({ faculty, success: false, error: error.message });
            }
        }

        res.status(200).json({
            success: true,
            message: "Faculty data processed",
            results,
        });
    } catch (error) {
        console.error("Error processing faculty data:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

module.exports = handleFacultyData;
const pool = require("../config/db");
const {
  updateFacultyAcademicRecords,
  createFacultyAcademicRecord,
} = require("../models/facultyAcademicRecordsModel");
require("dotenv").config();

const insertFacultyAcademicRecords = async (faculty_id, academicData) => {
  const client = await pool.connect();

  try {
      await client.query("BEGIN");

      const newRecord = await createFacultyAcademicRecord(academicData, faculty_id, client);

      await client.query("COMMIT");
      return newRecord;
  } catch (error) {
      await client.query("ROLLBACK");
      throw error;
  } finally {
      client.release();
  }
};

const pool = require("../config/db");
// CRUD ACADEMIC RECORDS
const createFacultyAcademicRecord = async (academicData, faculty_id, client) => {
    try {
      const query = `
        INSERT INTO faculty_academic_records (
          faculty_id,
          number_of_journal_published,
          number_of_books_published,
          number_of_books_edited,
          number_of_seminars_attended
        ) 
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *;
      `;
  
      const values = [
        faculty_id, 
        academicData.number_of_journal_published || null, 
        academicData.number_of_book_published || null, 
        academicData.number_of_book_edited || null, 
        academicData.number_of_seminars_attended || null
      ];
  
      const result = await client.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error("Error inserting faculty academic records:", error.message);
      throw new Error("Database insertion failed");
    }
  };
  require("../config/db");
const { insertNewCommitteeRole } = require("../models/committeeRolesModel");

// insert new committee role
const createCommitteeRoles = async (faculty_id, committeeRoles) => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        for (const role of committeeRoles) {
            await insertNewCommitteeRole(role, faculty_id, client);
        }

        await client.query("COMMIT");
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

const insertNewCommitteeRole = async (client, faculty_id, committeeRoles) => {
    if (!Array.isArray(committeeRoles) || committeeRoles.length === 0) {
        throw new Error("Committee roles data is required");
    }

    const values = [];
    const placeholders = [];

    committeeRoles.forEach((role, index) => {
        const { committee_id, role_in_committee } = role;

        if (!committee_id || !role_in_committee) {
            throw new Error(`Invalid entry at index ${index}: Committee ID and Role in Committee are required`);
        }

        // ✅ Correct SQL placeholders using a fixed index
        const baseIndex = index * 3 + 1; // 1-based indexing
        placeholders.push(`($${baseIndex}, $${baseIndex + 1}, $${baseIndex + 2})`);
        
        values.push(faculty_id, committee_id, role_in_committee);
    });

    const query = `
        INSERT INTO faculty_committee_roles (faculty_id, committee_id, role_in_committee)
        VALUES ${placeholders.join(", ")} RETURNING *;
    `;

    const result = await client.query(query, values);
    return result.rows;
}

const pool = require("../config/db");
require("dotenv").config();

// Upload faculty files
const uploadFacultyFiles = async (faculty_id, files) => {
  if (!faculty_id) throw new Error("No faculty ID provided.");
  if (!files || files.length === 0) throw new Error("No files uploaded.");

  const fieldMapping = {
      profilePhoto: "profile_photos",
      booksPublished: "books_published",
      seminars: "seminars_attended",
  };

  try {
      for (const file of files) {
          const dbField = fieldMapping[file.fieldname];
          if (!dbField) continue;

          const filePath = `/uploads/faculty/${file.filename}`;
          await pool.query(
              `INSERT INTO faculty_files (faculty_id, ${dbField}) VALUES ($1, $2)`,
              [faculty_id, filePath]
          );
      }
  } catch (error) {
      throw new Error("Error saving faculty files.");
  }
};