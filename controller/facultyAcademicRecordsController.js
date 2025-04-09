const pool = require("../config/db");
const {
  updateFacultyAcademicRecords,
  createFacultyAcademicRecord,
} = require("../models/facultyAcademicRecordsModel");
require("dotenv").config();

// insert a new academic record
const insertFacultyAcademicRecords = async (client, faculty_id, academicRecords) => {
  let localClient = client;
  let transactionStarted = false;

  try {
    // Use an existing client or create a new one
    if (!client) {
      localClient = await pool.connect();
      transactionStarted = true; // Track if this function manages the transaction
    }

    // Begin transaction if this function is responsible for it
    if (transactionStarted) {
      await localClient.query("BEGIN");
    }

    // Destructure academic records with default values
    const {
      numberOfJournalPublication = 0,
      numberOfBooksPublish = 0,
      numberOfEditedBookChapters = 0,
      numberOfSeminarsAttended = 0,
    } = academicRecords;

    // Prepare values for insertion
    const academicData = {
      number_of_journal_published: numberOfJournalPublication,
      number_of_books_published: numberOfBooksPublish,
      number_of_books_edited: numberOfEditedBookChapters,
      number_of_seminars_attended: numberOfSeminarsAttended,
    };

    console.log("Inserting academic data:", academicData);

    // Call the model to insert the academic record
    const insertedRecord = await createFacultyAcademicRecord(localClient, academicData, faculty_id);

    // Commit transaction if it was started here
    if (transactionStarted) {
      await localClient.query("COMMIT");
    }

    // Return the inserted record
    return insertedRecord;
  } catch (error) {
    // Rollback if a transaction was started here
    if (transactionStarted) {
      await localClient.query("ROLLBACK");
    }

    console.error("Error inserting faculty academic records:", error.message);
    throw error; // Re-throw to propagate the error
  } finally {
    // Release the client if it was created here
    if (transactionStarted) {
      localClient.release();
    }
  }
};

// get faculty records
const readFacultyAcademicRecords = async (req, res) => {
  try {
    const { faculty_id } = req.params;
    if (!faculty_id) {
      return res.status(400).json({ success: false, message: "No faculty ID" });
    }
    const query = `SELECT * FROM faculty_academin_records WHERE faculty_id = $1`;
    const result = await pool.query(query, faculty_id);
    if (result.rows.length === 0) {
      throw new Error("No records found");
    }
    return result.rows[0];
  } catch (error) {
    console.error("Error retrieving records", error.message);
    throw new Error(error.message);
  }
};
// Update academic records faculty
const updateFacultyRecords = async (req, res) => {
  try {
    const { faculty_id, record_id } = req.params;
    if (!faculty_id) {
      res.status(400).json({ success: false, message: "No faculty ID" });
    }

    const {
      number_of_journal_published,
      number_of_book_published,
      number_of_book_edited,
      number_of_seminars_attended,
    } = req.body;

    if (
      (!number_of_journal_published || !number_of_book_published,
      !book_published_filepath || !number_of_book_edited,
      !number_of_seminars_attended,
      !seminar_attended_filepath)
    ) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Please provide fields to be updated",
        });
    }

    const updatefields = {
      number_of_journal_published,
      number_of_book_published,
      book_published_filepath,
      number_of_book_edited,
      number_of_seminars_attended,
      seminar_attended_filepath,
    };
    // Call the model function to insert attendance
    const update = await updateFacultyAcademicRecords(faculty_id, record_id, updatefields);

    return res.status(201).json({ success: true, data: update });
  } catch (error) {
    console.error("Error updating academic records:", error.message);
    return res
      .status(500)
      .json({
        success: false,
        message: "An error occurred while updating records",
      });
  }
};

// Delete academic recoeds of faculty
const deleteFacultyAcademicRecords = async (req, res) => {
  try {
    const { faculty_id } = req.params;
    if (!faculty_id) {
      return res
        .status(400)
        .json({ success: false, message: "No fauculty_id provided" });
    }

    const query = `Delete from faculty_academic_records where faculty_id = $1`;
    const result = await pool.query(query, [faculty_id]);
    if (result.rows.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No Faculty found with this ID" });
    }
    res.status(200).json({
      success: true,
      message: "Faculty academic records deleted successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error Deleting Record:", error.message);
    res.status(500).json({
      success: false,
      message: "An error occured while deleting Records",
      error: error.message,
    });
  }
};

module.exports = {
  insertFacultyAcademicRecords,
  readFacultyAcademicRecords,
  updateFacultyRecords,
  deleteFacultyAcademicRecords
};
