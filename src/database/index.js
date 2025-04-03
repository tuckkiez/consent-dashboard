const { Pool } = require('pg');

// Create a new pool instance
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// Test the connection
async function testConnection() {
    try {
        await pool.query('SELECT NOW()');
        console.log('Database connection successful');
    } catch (error) {
        console.error('Error connecting to database:', error);
        throw error;
    }
}

// Run migrations
async function runMigrations() {
    try {
        const migrations = [
            '001_create_tables.sql'
        ];

        for (const migration of migrations) {
            const sql = await fs.promises.readFile(
                `./src/database/migrations/${migration}`,
                'utf-8'
            );
            await pool.query(sql);
            console.log(`Migration ${migration} completed`);
        }
    } catch (error) {
        console.error('Error running migrations:', error);
        throw error;
    }
}

// Initialize database
async function initDatabase() {
    await testConnection();
    await runMigrations();
}

module.exports = {
    pool,
    initDatabase
};
