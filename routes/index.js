const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const mysql = require('mysql');
const yup = require('yup');


// Define a schema for request validation
const schema = yup.object().shape({
  appName: yup.string().required(),
  appIcon: yup.string().url().required(),
  appLink: yup.string().url().required()
});


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

// Use the connectToDatabase middleware for all routes
router.use(connectToDatabase);



// Route for GET requests
router.get('/', (req, res) => {
  // Access the database connection using req.db
  req.db.query('SELECT * FROM my_table', (err, result) => {
    if (err) {
      console.log('Error accessing database:', err.message);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      res.status(200).json({
        _msg: "Request successful",
        data: result,
      });
    }
  });
});

// Routes for PUT, POST, and DELETE requests with authentication required
router.post('/', checkAuth, (req, res) => {

  

  schema.validate(req.body)
  .then(() => {
    const appName = req.body.appName;
    const appIcon = req.body.appIcon;
    const appLink = req.body.appLink;
    
    

  // Access the database connection using req.db
  req.db.query('INSERT INTO my_table (app_name, app_icon, app_link) VALUES (?, ?, ?)', [appName, appIcon, appLink], (err, result) => {
    if (err) {
      console.log('Error inserting data:', err.message);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      res.status(201).json({
        _msg: "Data inserted successfuly",
        data: result
      });
    }
  });

  })
  .catch((err) => {
  console.log('Error validating data:', err.message);
  res.status(400).json({ error: err.message });
  });
  
});



router.put('/:id', checkAuth, (req, res) => {


  // Validate request against the schema
  schema.validate(req.body)
  .then(() => {
    const appName = req.body.appName;
    const appIcon = req.body.appIcon;
    const appLink = req.body.appLink;

  // Access the database connection using req.db
  req.db.query('UPDATE my_table SET app_name = ?, app_icon = ?, app_link = ? WHERE id = ?', [appName, appIcon, appLink, req.params.id], (err, result) => {
    if (err) {
      console.log('Error updating data:', err.message);
      res.status(500).json({ error: 'Internal Server Error' });
    } else if (result.affectedRows === 0) {
      res.status(404).json({ error: 'Record not found' });
    } else {
      res.status(200).json({
        _msg: 'Data updated successfully',
        data: result,
      });
    }
  });

  })
  .catch((err) => {
  console.log('Error validating data:', err.message);
  res.status(400).json({ error: err.message });
  });
});

router.delete('/:id', checkAuth, (req, res) => {

  const id = req.params.id;
  // Access the database connection using req.db
  req.db.query('DELETE FROM my_table WHERE id = ?', id, (err, result) => {
    if (err) {
      console.log('Error deleting data:', err.message);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      res.status(200).json({
        _msg: "Data deleted successfuly"
      });
    }
  });
});

module.exports = router;

