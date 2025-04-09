const pool =require("../config/db");
const { insertNewCommitteeRole } = require("../models/committeeRolesModel");

// Insert new committee roles
const createCommitteeRoles = async (client, faculty_id, committeeRoles) => {
    let localClient = client;
    let transactionStarted = false;
  
    try {
      // Validate input
      if (!Array.isArray(committeeRoles) || committeeRoles.length === 0) {
        throw new Error("NO Committee roles data .");
      }
  
      // Use an existing client or create a new one
      if (!client) {
        localClient = await pool.connect();
        transactionStarted = true; // Track if this function manages the transaction
      }
  
      // Begin transaction if this function is responsible for it
      if (transactionStarted) {
        await localClient.query("BEGIN");
      }
  
      // Insert each role
      for (const role of committeeRoles) {
        console.log("Processing role:", role); // Log each role being processed
        await insertNewCommitteeRole({ committeeRoles: [role] }, faculty_id, localClient);
      }
  
      // Commit transaction if started here
      if (transactionStarted) {
        await localClient.query("COMMIT");
      }
    } catch (error) {
      // Rollback transaction if started here
      if (transactionStarted) {
        await localClient.query("ROLLBACK");
      }
      console.error("Error in createCommitteeRoles:", error.message); // Log the error for debugging
      throw error;
    } finally {
      // Release the client if it was created here
      if (transactionStarted) {
        localClient.release();
      }
    }
  };
  

// update committee roles
const updateCommitteeRoles = async (req, res, client) => {
    try {
        const { faculty_id } = req.params;
        if (!faculty_id) {
            return res.status(400).json({ success: false, message: "No faculty ID provided" });
        }

        const { role_id, role_in_committee } = req.body;
        if (!role_id || !role_in_committee) {
            return res.status(400).json({ success: false, message: "No role ID or committee role provided" });
        }

        const query = `
            UPDATE faculty_committee_roles 
            SET role_in_committee = $1 
            WHERE role_id = $2 AND faculty_id = $3 
            RETURNING *;
        `;
        const values = [role_in_committee, role_id, faculty_id];

        const result = await client.query(query, values);

        if (result.rowCount === 0) {
            return res.status(404).json({ success: false, message: "No matching role found for update" });
        }

        return res.status(200).json({ success: true, data: result.rows[0] });

    } catch (error) {
        console.error("Error updating committee role:", error);
        return res.status(500).json({ success: false, message: `Error updating role: ${error.message}` });
    }
};

// Get faculy roles
const retrieveFacultyCommitteeRoles = async (req, res) => {
    try{
        const { faculty_id } = req.params;
        if(!faculty_id){
            return res.status(400).json({success:false, message:" No faculty ID"});
        }
        const query = `
                        SELECT 
                            fcr.role_id,
                            fcr.faculty_id,
                            c.committee_name,
                            fcr.role_in_committee
                        FROM faculty_committee_roles fcr
                        JOIN committee c ON fcr.committee_id = c.committee_id
                        WHERE fcr.faculty_id = $1;
        `;
        const result = await pool.query(faculty_id);
        
        if (result.rowCount === 0){
            return res.status(404).json({success: false, message: "No committee found for this faculty"})
        }
        return res.status(200).json({success: true, data: result.rows[0]});
    }catch(error){
        console.log("Error fetching faculty roles");
        return res.status(500).json({success: false, message: `Error fetching Committee Roles ${error.message}`});
    }
};

// delete committee roles
const deleteFacultyCommiteeRoles = async(req, res) => {
    try{
        const { faculty_id } = req.params;
        if(!faculty_id){
            return res.status(400).json({success:false, message:"No faculty ID"});
        }
        const { role_id } = req.body;
        if(!role_id){
            return res.status(400).json({success:false, message:"No Role ID"});
        }
        const query = `
                        DELETE FROM faculty_academic_roles where faculty_id = $1 AND role_id = $2;
                    `;
        const result = await pool.query(faculty_id, role_id, query);
        if (result.rowCount === 0){
            return res.status(404).json({success: false, message: "No faculty role found for this Faculty"});
        }
        return res.status(200).json({success: true, data: result.rows[0]});
    }catch(error){
        console.log("Failed to delete Record");
        return res.status(500).json({success:false, message: `Error deleting data ${error.message}`});
    }
};
module.exports = {
    createCommitteeRoles,
    updateCommitteeRoles,
    retrieveFacultyCommitteeRoles,
    deleteFacultyCommiteeRoles
}