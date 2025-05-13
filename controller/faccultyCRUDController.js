const {
  insertFacultyAcademicRecords,
} = require("./facultyAcademicRecordsController");
const { newFaculty } = require("./basicFacultyController");
const { uploadFacultyFiles } = require("./facultyFileUploadController");
const { createCommitteeRoles } = require("./committeeRolesController");
const client = require("../config/db")
const handleFacultyCRUDController = async (req, res) => {
  try {
    // Parse incoming data
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
    if (typeof personalDetails !== "object" || Array.isArray(personalDetails)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid personal details format." });
    }

    const results = [];
    let overallSuccess = true;

    try {
      await client.query("BEGIN");
      const createdFaculty = await newFaculty(client, personalDetails);
      const faculty_id = createdFaculty.faculty_id;
      if (academicRecords) {
        console.log("personal:", personalDetails);
        await insertFacultyAcademicRecords(client, faculty_id, academicRecords);
      }

      if (Array.isArray(CommitteeIDAndRole) && CommitteeIDAndRole.length > 0) {
        await createCommitteeRoles(client, faculty_id, CommitteeIDAndRole);
      }
      // if (req.files) {
      //   await uploadFacultyFiles(client, faculty_id, req.files);
      // }
      await client.query("COMMIT"); 
      results.push({ faculty: createdFaculty, success: true });
    } catch (error) {
      overallSuccess = false; 
      await client.query("ROLLBACK"); 
      console.error(`Error processing faculty: ${personalDetails.name}`, error);
      results.push({
        faculty: personalDetails,
        success: false,
        error: error.message,
      });
    }

    // Set response status based on overall success
    const statusCode = overallSuccess ? 200 : 500;
    const message = overallSuccess
      ? "Faculty data processed successfully"
      : "Faculty data processing encountered errors";

    res.status(statusCode).json({
      success: overallSuccess,
    });
  } catch (error) {
    console.error("Error processing faculty data:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

module.exports = handleFacultyCRUDController;
