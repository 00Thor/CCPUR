const {
  insertFacultyAcademicRecords,
} = require("./facultyAcademicRecordsController");
const { newFaculty } = require("./basicFacultyController");
const { uploadFacultyFiles } = require("./facultyFileUploadController");
const { createCommitteeRoles } = require("./committeeRolesController");
const client = require("../config/db")

const handleFacultyData = async (req, res) => {
  try {
    // Parse personalDetails from string to object
    const personalDetails =
      typeof req.body.personalDetails === "string"
        ? JSON.parse(req.body.personalDetails)
        : req.body.personalDetails;

    const academicRecords =
      typeof req.body.academicRecords === "string"
        ? JSON.parse(req.body.academicRecords)
        : req.body.academicRecords;

    const CommitteeIDAndRole =
      typeof req.body.CommitteeIDAndRole === "string"
        ? JSON.parse(req.body.CommitteeIDAndRole)
        : req.body.CommitteeIDAndRole;

    if (!personalDetails) {
      return res
        .status(400)
        .json({ success: false, message: "Personal details are required." });
    }

    // Ensure personalDetails is a valid object
    if (typeof personalDetails !== "object" || Array.isArray(personalDetails)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid personal details format." });
    }

    const results = [];

    try {
        await client.query("BEGIN");
      // Insert faculty personal details and get `faculty_id`
      const createdFaculty = await newFaculty(client, personalDetails);

      const faculty_id = createdFaculty.faculty_id;

      // Insert academic records
      if (academicRecords) {
        await insertFacultyAcademicRecords(client, faculty_id, academicRecords);
      }

      // Create committee roles
      if (Array.isArray(CommitteeIDAndRole) && CommitteeIDAndRole.length > 0) {
        await createCommitteeRoles(client, faculty_id, CommitteeIDAndRole);
      }

      // Upload files
      if (req.files) {
        Object.keys(req.files).forEach((key) => {
        });
        await uploadFacultyFiles(client, faculty_id, req.files);
      } else {
        console.log("No files found in the request.");
      }

      await client.query("COMMIT"); // Commit transaction
      results.push({ faculty: createdFaculty, success: true });
    } catch (error) {
    await client.query("ROLLBACK"); // Rollback transaction on error
      console.error(`Error processing faculty: ${personalDetails.name}`, error);
      results.push({
        faculty: personalDetails,
        success: false,
        error: error.message,
      });
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
