var mysql = require('mysql');
require('dotenv').config();


var Connection = mysql.createConnection({
    host: process.env.HOST,
    user: process.env.USER,
    password: process.env.PASSWORD,
  })



module.exports = Connection;