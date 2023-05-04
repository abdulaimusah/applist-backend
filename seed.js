const mysql = require('mysql');
const bcrypt = require('bcryptjs');
require("dotenv").config();

// Get environment variables 
/*
const dbHost = process.env.DB_HOST;
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;
const dbName = process.env.DB_NAME; */

// Create database connection
const connection = mysql.createConnection({
  host: process.env.HOST,
  user: process.env.USER,
  password: process.env.PASSWORD,
  database: process.env.DATABASE,
});

// Hash password
const saltRounds = 10;
const salt = bcrypt.genSaltSync(saltRounds);
const plainPassword = process.env.ADMIN_PASSWORD;
const hashedPassword = bcrypt.hashSync(plainPassword, salt);

// Insert user data into database
const userData = {
  name: process.env.ADMIN_NAME,
  email: process.env.ADMIN_EMAIL,
  password: hashedPassword,
};

connection.connect((err) => {
    if (err) {
      console.log('Error connecting to database:', err.message);
      return;
    }
  
    console.log('Connected to database');
  

});

connection.query(
  `CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
  )`,
  (err, result) => {
    if (err) {
      console.log('Error creating users table:', err.message);
    } else {
      console.log('Users table created successfully');
    }
  }
);

connection.query('INSERT INTO users SET ?', userData, (err, results, fields) => {
  if (err) throw err;
  console.log(`User '${userData.name}' has been added with ID ${results.insertId}`);
});

// Close connection
connection.end();
