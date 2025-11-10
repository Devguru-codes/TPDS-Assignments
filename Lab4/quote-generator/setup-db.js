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

// Sample quotes data
const sampleQuotes = [
  { id: 1, text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { id: 2, text: "Life is what happens when you're busy making other plans.", author: "John Lennon" },
  { id: 3, text: "Stay hungry, stay foolish.", author: "Steve Jobs" },
  { id: 4, text: "You miss 100% of the shots you don't take.", author: "Wayne Gretzky" },
];

async function setupDatabase() {
  let connection;

  try {
    // Connect without specifying database
    connection = await mysql.createConnection(dbConfig);
    console.log('✓ Connected to MySQL server');

    // Create database if it doesn't exist (should already exist from Lab1)
    await connection.execute('CREATE DATABASE IF NOT EXISTS tpds_assignments');
    console.log('✓ Database "tpds_assignments" ready');

    // Close initial connection
    await connection.end();

    // Connect to the specific database
    const dbConnection = await mysql.createConnection({
      ...dbConfig,
      database: 'tpds_assignments'
    });
    console.log('✓ Connected to tpds_assignments database');

    // Create quotes table for Lab4
    const createQuotesTableQuery = `
      CREATE TABLE IF NOT EXISTS lab4_quotes (
        id INT PRIMARY KEY,
        text VARCHAR(500) NOT NULL,
        author VARCHAR(100) NOT NULL
      )
    `;

    await dbConnection.execute(createQuotesTableQuery);
    console.log('✓ Table "lab4_quotes" created or already exists');

    // Create favorites table for Lab4
    const createFavoritesTableQuery = `
      CREATE TABLE IF NOT EXISTS lab4_favorites (
        id INT AUTO_INCREMENT PRIMARY KEY,
        text VARCHAR(500) NOT NULL,
        author VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await dbConnection.execute(createFavoritesTableQuery);
    console.log('✓ Table "lab4_favorites" created or already exists');

    // Insert sample quotes if they don't exist
    for (const quote of sampleQuotes) {
      await dbConnection.execute(
        'INSERT IGNORE INTO lab4_quotes (id, text, author) VALUES (?, ?, ?)',
        [quote.id, quote.text, quote.author]
      );
    }
    console.log('✓ Sample quotes inserted');

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
