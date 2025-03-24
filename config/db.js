require('dotenv').config();
const mysql = require('mysql2');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'library_management',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test the database connection
pool.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);

    switch (err.code) {
      case 'ER_BAD_DB_ERROR':
        console.error('❌ Database does not exist. Create it first or check your DB_NAME in .env.');
        break;
      case 'ER_ACCESS_DENIED_ERROR':
        console.error('❌ Invalid database credentials. Check DB_USER and DB_PASSWORD in .env.');
        break;
      case 'ENOTFOUND':
        console.error('❌ Database host not found. Verify DB_HOST in .env.');
        break;
      default:
        console.error(`❌ Unexpected database error: ${err.code}`);
    }

    process.exit(1); // Exit the application if the database connection fails
  }

  if (connection) {
    console.log('✅ Database connected successfully!');
    connection.release(); // Release the connection back to the pool
  }
});

module.exports = pool.promise();
