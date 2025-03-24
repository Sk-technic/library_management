const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Create MySQL connection
const connection = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true
});

// Read schema.sql file
const schemaPath = path.join(__dirname, 'schema.sql');
if (!fs.existsSync(schemaPath)) {
    console.error('❌ schema.sql file not found!');
    process.exit(1);
}
const schema = fs.readFileSync(schemaPath, 'utf8');

// Execute schema.sql
connection.connect((err) => {
    if (err) {
        console.error('❌ Database connection failed:', err);
        return;
    }
    console.log('✅ Connected to MySQL');

    connection.query(schema, (err, results) => {
        if (err) {
            console.error('❌ Error executing schema:', err);
        } else {
            console.log('✅ Database and tables created successfully!');
        }
        connection.end();
    });
});
