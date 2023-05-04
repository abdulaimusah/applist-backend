const express = require('express');
const jwt = require('jsonwebtoken');
const yup = require('yup');
const mysql = require('mysql');
const bcrypt = require('bcryptjs');

const router = express.Router();


// Middleware to establish database connection
const connectToDatabase = (req, res, next) => {
    const db = mysql.createConnection({
      host: process.env.HOST,
      user: process.env.USER,
      password: process.env.PASSWORD,
      database: process.env.DATABASE,
      port: process.env.DB_PORT,
    });
  
    db.connect((err) => {
      if (err) {
        console.log('Error connecting to database:', err.message);
        // Return a 500 Internal Server Error response if there is an error connecting to the database
        res.status(500).json({ error: 'Internal Server Error' });
      } else {
        console.log('Connected to database');
        // Pass the database connection on to the next middleware
        req.db = db;
        next();
      }
    });
};

router.use(connectToDatabase);

// Define schema for request body validation
const loginSchema = yup.object().shape({
  email: yup.string().email().required(),
  password: yup.string().min(8).matches(/^(?=.*\d)(?=.*[!@#$%^&*])(?=.*[A-Z]).{8,}$/, 'Invalid password').required(),
});

router.post('/', async (req, res) => {
  try {
    // Validate request body
    const { email, password } = await loginSchema.validate(req.body);
  
  
    // Check if user exists in database
    req.db.query('SELECT * FROM users WHERE email = ?', [email], async (error, results) => {
      if (error) {
        return res.status(500).json({ error: 'Database error' });
      }
  
      const user = results[0];
  
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      
  
      // Check if password is correct
      const isPasswordValid = await bcrypt.compare(password, user.password);
  
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid password' });
      }
  
      // Create JWT token
      const token = jwt.sign({ email: email },
         process.env.JWT_SECRET, {expiresIn: "10h"});
  
      // Respond with token
      res.json({ token });
    });
  
  } catch (error) {
    // Handle validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
  
    // Handle other errors
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
  
});


module.exports = router;
