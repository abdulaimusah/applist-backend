const mysql = require("mysql");
const bcrypt = require("bcryptjs");
const yup = require("yup");
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
  port: process.env.DB_PORT,
});

const seedSchema = yup.object().shape({
  name: yup.string().required("Name is required"),
  email: yup.string().email("Invalid email").required("Email is required"),
  password: yup
    .string()
    .min(8, "Password must be at least 8 characters")
    .matches(
      /^(?=.*\d)(?=.*[!@#$%^&*])(?=.*[A-Z]).{8,}$/,
      "Password must contain at least one digit, one special character, one uppercase letter, and be at least 8 characters long"
    )
    .required("Password is required"),
});

// Hash password
const saltRounds = 10;
const salt = bcrypt.genSaltSync(saltRounds);
const plainPassword = process.env.ADMIN_PASSWORD;
const hashedPassword = bcrypt.hashSync(plainPassword, salt);


const userData = {
  name: process.env.ADMIN_NAME,
  email: process.env.ADMIN_EMAIL,
  password: hashedPassword,
};




try {
seedSchema
  .validate({
    name: process.env.ADMIN_NAME,
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
  })

  .then(() => {

    connection.connect((err) => {
      if (err) {
        console.log("Error connecting to database:", err.message);
        return;
      }
    
      console.log("Connected to database");
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
          console.log("Error creating users table:", err.message);
        } else {
          console.log("Users table created successfully");
        }
      }
    );
    
    connection.query(
      "INSERT INTO users SET ?",
      userData,
      (err, results, fields) => {
        if (err) throw err;
        console.log(
          `User '${userData.name}' has been added with ID ${results.insertId}`
        );
      }
    );

    // Close connection
    connection.end();
  })
}
  catch (error) {
    console.log(error)
  }
