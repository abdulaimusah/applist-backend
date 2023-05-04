const express = require('express');
const router = express.Router();
const mysql = require('mysql');
const yup = require('yup');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Create a connection to the MySQL database
const db = mysql.createConnection({
  host: process.env.HOST,
  user: process.env.USER,
  password: process.env.PASSWORD,
  database: process.env.DATABASE,
});

// middleware to check for authorization
function checkAuth(req, res, next) {
  const authHeader = decodeURIComponent(req.headers.authorization);
  if (!authHeader) {
    return res.status(401).json({ error: 'Missing authorization header' });
  }
  const token = authHeader.split(' ')[1];
  

  
  
  try {
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { email: decodedToken.email };
    next();
  } catch (error) {
   
    res.status(401).json({ error: 'Invalid token' });
  }
}

// Route for adding a new user to the database
router.post('/', checkAuth, async (req, res) => {
  try {
    // Define the validation schema for the request body
    const schema = yup.object().shape({
      name: yup.string().required(),
      email: yup.string().email().required(),
      password: yup.string().min(8).matches(/^(?=.*\d)(?=.*[!@#$%^&*])(?=.*[A-Z]).{8,}$/, 'Invalid password').required(),
    });

    // Validate the request body against the schema
    await schema.validate(req.body);

    // Extract the name, email, and password fields from the request body
    const { name, email, password } = req.body;

    // Query the database to check if a user with the given email already exists
    db.query('SELECT * FROM users WHERE email = ?', [email], async (error, results) => {
      if (error) {
        console.log(error);
        res.status(500).json({ error: 'Internal Server Error' });
      } else if (results.length > 0) {
        // If a user with the given email already exists, return an error response
        res.status(400).json({ error: 'Email already exists' });
      } else {
        // Hash the password using bcrypt
        const salt = bcrypt.genSaltSync(10)
        const hashedPassword = await bcrypt.hash(password, salt);

        // Insert the new user into the database
        db.query('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [name, email, hashedPassword], (error, results) => {
          if (error) {
            console.log(error);
            res.status(500).json({ error: 'Internal Server Error' });
          } else {
            // Generate a JWT token for the new user and return it in the response
            const token = jwt.sign({ 
              email: email
             },
               process.env.JWT_SECRET, {expiresIn: "10h" } );
            res.status(200).json({ token });
          }
        });
      }
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
