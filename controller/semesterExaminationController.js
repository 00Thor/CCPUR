const studentExamination = require("../models/modelSemesterExamination");
require("../config/db");

const semesterExamination = async (req, res, next) => {
  try {
    const studentData = req.body; // Extract student data from request body

    const requiredFields = [
      "application_for", "examination_session", "ABC_id", "registration_no", "of_year", "roll_no", "dept_code",
      "fathers_name", "guardian_name", "permanent_address", "course_code", "year_semester", "sex", "category"
    ];
    
    // Validate Paper Codes and Paper Numbers (At least one set must be provided)
    const paperFields = [
      ["papercode_a", "paperno_a"], ["papercode_b", "paperno_b"], ["papercode_c", "paperno_c"],
      ["papercode_d", "paperno_d"], ["papercode_e", "paperno_e"], ["papercode_f", "paperno_f"],
      ["papercode_g", "paperno_g"], ["papercode_h", "paperno_h"], ["papercode_i", "paperno_i"],
      ["papercode_j", "paperno_j"]
    ];
    
    // Validate Exam Passed fields (At least one set must be provided)
    const examFields = [
      ["exampassed1", "board1", "year1", "roll_no1", "division1", "subject_taken1"],
      ["exampassed2", "board2", "year2", "roll_no2", "division2", "subject_taken2"],
      ["exampassed3", "board3", "year3", "roll_no3", "division3", "subject_taken3"],
      ["exampassed4", "board4", "year4", "roll_no4", "division4", "subject_taken4"]
    ];
    
    // Check for missing required fields
    const missingFields = requiredFields.filter(field => !studentData[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({ error: `Missing required fields: ${missingFields.join(", ")}` });
    }
    
    // Ensure at least one exam record is filled
    const hasExamRecord = examFields.some(fields => fields.some(field => studentData[field]));
    if (!hasExamRecord) {
      return res.status(400).json({ error: "At least one exam record must be provided." });
    }
    
    // Ensure at least one paper code-number pair is provided
    const hasPaper = paperFields.some(([code, number]) => studentData[code] || studentData[number]);
    if (!hasPaper) {
      return res.status(400).json({ error: "At least one paper code and number pair must be provided." });
    }
 
    // Call the model function to insert data
    const newStudentRecord = await studentExamination(studentData);

    res.status(201).json({
      message: "Student examination record inserted successfully",
      data: newStudentRecord,
    });
  } catch (error) {
    console.error("Controller Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = { semesterExamination };
