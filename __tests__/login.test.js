const request = require("supertest");
const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const yup = require("yup");
const mysql = require("mysql");

const loginRoute = require("../routes/login");

require("dotenv").config();

const JWT_SecretKey = "secret";


// Email and password that were used to seed database.
const testEmail = process.env.ADMIN_EMAIL;
const testPassword = process.env.ADMIN_PASSWORD;

describe("login route", () => {
  let app;
  let db;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));

    // Establish the database connection
    db = mysql.createConnection({
      host: process.env.HOST,
      user: process.env.USER,
      password: process.env.PASSWORD,
      database: process.env.DATABASE,
      port: process.env.DB_PORT,
    });

    db.connect((err) => {
      if (err) {
        console.error("Error connecting to database:", err.message);
      } else {
        console.log("Connected to database");
      }
    });

    app.use((req, res, next) => {
      req.db = db;
      next();
    });

    app.use(loginRoute);
  });

  afterAll((done) => {
    // Close the database connection
    db.end((err) => {
      if (err) {
        console.error("Error closing database connection:", err.message);
      } else {
        console.log("Database connection closed");
      }
      done();
    });
  });

  test("should respond with 400 if request body is invalid", async () => {
    const res = await request(app)
      .post("/")
      .send({ email: "invalidemail", password: "shortpw" });

    expect(res.status).toBe(400);
  });

  test("should respond with 404 if user is not found", async () => {
    const res = await request(app)
      .post("/")
      .send({ email: "nonexistenttest@email.com", password: testPassword });

    expect(res.status).toBe(404);
  });

  test("should respond with 401 if password is wrong", async () => {
    const res = await request(app)
      .post("/")
      .send({ email: testEmail, password: "WrongP@1" });

    expect(res.status).toBe(401);
  });

  test("should respond with 200 and a JWT token if login is successful", async () => {
    const res = await request(app)
      .post("/")
      .send({ email: testEmail, password: testPassword });

    expect(res.status).toBe(200);
    expect(res.body.data).toBeTruthy();
    console.log(res.body.data);
  });
});
