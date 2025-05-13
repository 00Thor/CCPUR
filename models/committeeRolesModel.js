const pool = require("../config/db");

const insertNewCommitteeRole = async ({ committeeRoles }, faculty_id, client) => {

    if (!Array.isArray(committeeRoles) || committeeRoles.length === 0) {
        throw new Error("Committee roles data is present");
    }

    const values = [];
    const placeholders = [];

    committeeRoles.forEach((role, index) => {
        const { committee_id, role_in_committee } = role;

        if (!committee_id || !role_in_committee) {
            throw new Error(`Invalid entry at index ${index}: Committee ID and Role in Committee are required`);
        }

        const baseIndex = index * 3 + 1; // Calculate placeholder positions
        placeholders.push(`($${baseIndex}, $${baseIndex + 1}, $${baseIndex + 2})`);

        values.push(faculty_id, committee_id, role_in_committee);
    });

    const query = `
        INSERT INTO faculty_committee_roles (faculty_id, committee_id, role_in_committee)
        VALUES ${placeholders.join(", ")}
        RETURNING *;
    `;

    try {
        const result = await client.query(query, values);

        if (result.rows.length === 0) {
            console.warn("No rows were inserted into faculty_committee_roles.");
        }

        return result.rows;
    } catch (error) {
        console.error("Error executing insertNewCommitteeRole query:", error.message);
        throw new Error("Failed to insert committee roles. Please check your data and try again.");
    }
};

module.exports = {
    insertNewCommitteeRole,
};
