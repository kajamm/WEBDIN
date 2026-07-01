import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbHost = process.env.DB_HOST || 'localhost';
const dbUser = process.env.DB_USER || 'root';
const dbPassword = process.env.DB_PASSWORD || '';
const dbName = process.env.DB_NAME || 'db_karyawan';

const pool = mysql.createPool({
  host: dbHost,
  user: dbUser,
  password: dbPassword,
  database: dbName,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export const initDb = async () => {
  try {
    // 1. Create a temporary connection to ensure the database exists
    const tempConnection = await mysql.createConnection({
      host: dbHost,
      user: dbUser,
      password: dbPassword
    });
    
    console.log(`Ensuring database '${dbName}' exists...`);
    await tempConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    await tempConnection.end();

    // 2. Obtain connection from pool
    const connection = await pool.getConnection();
    console.log(`Database '${dbName}' connected successfully.`);

    // Check if table 'mahasiswa' exists and has 'angkatan' column.
    // If not, we drop tables and recreate them to ensure the schema is correct.
    const [columns]: any = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'mahasiswa' AND COLUMN_NAME = 'angkatan'
    `, [dbName]);

    if (columns.length === 0) {
      console.log("Database schema is outdated or tables do not exist. Re-initializing schema...");
      await connection.query('SET FOREIGN_KEY_CHECKS = 0');
      await connection.query('DROP TABLE IF EXISTS mahasiswa');
      await connection.query('DROP TABLE IF EXISTS prodi');
      await connection.query('DROP TABLE IF EXISTS users');
      await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    }

    // 3. Create prodi table if not exists
    await connection.query(`
      CREATE TABLE IF NOT EXISTS prodi (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nama_prodi VARCHAR(255) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    // 4. Create mahasiswa table if not exists
    await connection.query(`
      CREATE TABLE IF NOT EXISTS mahasiswa (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nim VARCHAR(50) NOT NULL UNIQUE,
        nama VARCHAR(255) NOT NULL,
        prodi_id INT NOT NULL,
        angkatan VARCHAR(50) NOT NULL,
        foto VARCHAR(255) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (prodi_id) REFERENCES prodi(id) ON UPDATE CASCADE ON DELETE RESTRICT
      ) ENGINE=InnoDB;
    `);

    // 5. Create users table if not exists
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'operator', 'viewer') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    // 6. Seed default Program Studi if empty
    const [rows]: any = await connection.query('SELECT COUNT(*) as count FROM prodi');
    if (rows[0].count === 0) {
      await connection.query(`
        INSERT INTO prodi (nama_prodi) VALUES 
        ('Informatika'),
        ('Sistem Informasi'),
        ('Teknik Elektro'),
        ('Manajemen'),
        ('Akuntansi')
      `);
      console.log('Default Prodi seeded.');
    }

    connection.release();
    console.log('Database tables verified and initialized.');
  } catch (error) {
    console.error('Error during database initialization:', error);
    throw error;
  }
};

export default pool;
