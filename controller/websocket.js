const { Server } = require('socket.io');
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.PG_USER,         // Your PostgreSQL username
  password: process.env.PG_PASSWORD, // Your PostgreSQL password
  host: process.env.PG_HOST,         // PostgreSQL server host
  port: process.env.PG_PORT || 5432, // PostgreSQL port (default is 5432)
  database: process.env.PG_DATABASE, // Your PostgreSQL database name
});

function setupWebSocket(server) {
    const io = new Server(server, {
        cors: { origin: "http://localhost:3000" }, // Adjust for your frontend
    });

    io.on('connection', (socket) => {
        console.log('Admin connected to WebSocket');

        socket.on('new_application', async () => {
            try {
                const result = await pool.query("SELECT * FROM applications WHERE status = 'pending'");
                io.emit('update_pending', result.rows); // Broadcast to all clients
            } catch (error) {
                console.error("Error fetching pending applications:", error);
            }
        });

        socket.on('disconnect', () => {
            console.log('Admin disconnected from WebSocket');
        });
    });
}

module.exports = { setupWebSocket };
