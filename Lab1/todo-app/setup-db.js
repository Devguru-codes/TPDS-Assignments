require('dotenv').config();

const mysql = require('mysql2/promise');

// Database configuration (without specifying database initially)
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

async function setupDatabase() {
  let connection;

  try {
    // Connect without specifying database
    connection = await mysql.createConnection(dbConfig);
    console.log('✓ Connected to MySQL server');

    // Create database if it doesn't exist
    await connection.execute('CREATE DATABASE IF NOT EXISTS tpds_assignments');
    console.log('✓ Database "tpds_assignments" created or already exists');

    // Close initial connection
    await connection.end();

    // Connect to the specific database
    const dbConnection = await mysql.createConnection({
      ...dbConfig,
      database: 'tpds_assignments'
    });
    console.log('✓ Connected to tpds_assignments database');

    // Create todos table for Lab1
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS lab1_todos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        text VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await dbConnection.execute(createTableQuery);
    console.log('✓ Table "lab1_todos" created or already exists');

    await dbConnection.end();
    console.log('🎉 Database setup completed successfully!');

  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    process.exit(1);
  }
}

// Run setup if this script is executed directly
if (require.main === module) {
  setupDatabase();
}

module.exports = setupDatabase;
