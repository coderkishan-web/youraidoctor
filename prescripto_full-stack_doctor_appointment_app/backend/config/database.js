import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to JSON fallback data directory
const DATA_DIR = path.join(__dirname, '..', 'data');

// Ensure data directory and JSON files exist
function ensureJsonFiles() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const files = ['users.json', 'doctors.json', 'appointments.json'];
    for (const file of files) {
        const filePath = path.join(DATA_DIR, file);
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, JSON.stringify([], null, 2));
        }
    }
}

// ─── Database State ───────────────────────────────────────────────────────────
let pool = null;
let usingSQL = false;

// ─── MySQL Setup ──────────────────────────────────────────────────────────────
async function setupMySQLTables(connection) {
    // Users table
    await connection.query(`
        CREATE TABLE IF NOT EXISTS users (
            id          INT AUTO_INCREMENT PRIMARY KEY,
            name        VARCHAR(255) NOT NULL,
            email       VARCHAR(255) NOT NULL UNIQUE,
            password    TEXT NOT NULL,
            image       LONGTEXT,
            phone       VARCHAR(50) DEFAULT '000000000',
            address     TEXT DEFAULT '{"line1":"","line2":""}',
            gender      VARCHAR(50) DEFAULT 'Not Selected',
            dob         VARCHAR(50) DEFAULT 'Not Selected',
            created_at  BIGINT DEFAULT 0
        )
    `);

    // Doctors table
    await connection.query(`
        CREATE TABLE IF NOT EXISTS doctors (
            id           INT AUTO_INCREMENT PRIMARY KEY,
            name         VARCHAR(255) NOT NULL,
            email        VARCHAR(255) NOT NULL UNIQUE,
            password     TEXT NOT NULL,
            image        TEXT,
            speciality   VARCHAR(255),
            degree       VARCHAR(255),
            experience   VARCHAR(255),
            about        TEXT,
            available    TINYINT(1) DEFAULT 1,
            fees         DECIMAL(10,2) DEFAULT 0,
            slots_booked LONGTEXT DEFAULT '{}',
            address      TEXT DEFAULT '{}',
            date         BIGINT DEFAULT 0
        )
    `);

    // Appointments table
    await connection.query(`
        CREATE TABLE IF NOT EXISTS appointments (
            id           INT AUTO_INCREMENT PRIMARY KEY,
            userId       VARCHAR(50) NOT NULL,
            docId        VARCHAR(50) NOT NULL,
            slotDate     VARCHAR(50) NOT NULL,
            slotTime     VARCHAR(50) NOT NULL,
            userData     LONGTEXT,
            docData      LONGTEXT,
            amount       DECIMAL(10,2) DEFAULT 0,
            date         BIGINT DEFAULT 0,
            cancelled    TINYINT(1) DEFAULT 0,
            payment      TINYINT(1) DEFAULT 0,
            isCompleted  TINYINT(1) DEFAULT 0
        )
    `);
}

// ─── Connect Function ─────────────────────────────────────────────────────────
const connectDB = async () => {
    ensureJsonFiles();

    // Check if MySQL env vars are set
    if (!process.env.MYSQL_HOST && !process.env.DB_HOST) {
        console.log('⚠️  No MySQL credentials found in .env — using JSON file fallback');
        usingSQL = false;
        return;
    }

    try {
        pool = mysql.createPool({
            host:     process.env.MYSQL_HOST     || process.env.DB_HOST     || 'localhost',
            port:     process.env.MYSQL_PORT     || process.env.DB_PORT     || 3306,
            user:     process.env.MYSQL_USER     || process.env.DB_USER     || 'root',
            password: process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || '',
            database: process.env.MYSQL_DATABASE || process.env.DB_NAME     || 'prescripto',
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
        });

        // Test connection and create tables
        const connection = await pool.getConnection();
        console.log('✅ MySQL Connected Successfully');
        await setupMySQLTables(connection);
        console.log('✅ MySQL Tables Ready');
        connection.release();
        usingSQL = true;

    } catch (error) {
        console.error('❌ MySQL connection failed:', error.message);
        console.log('⚠️  Falling back to JSON file storage');
        pool = null;
        usingSQL = false;
    }
};

// ─── Exports ──────────────────────────────────────────────────────────────────
export { pool, DATA_DIR, connectDB };
export const isSQL = () => usingSQL;
