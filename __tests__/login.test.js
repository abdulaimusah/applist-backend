const request = require('supertest');
const server = require('../bin/www'); // Replace with your Express app
const bcrypt = require('bcrypt');

const app = server.listen(process.env.PORT);

describe('Login endpoint', () => {
  it('should respond with a token when valid email and password are provided', async () => {
    const email = 'testuser@example.com';
    const password = 'Abcd1234!';

    // Hash password
    const saltRounds = 10;
    const salt = bcrypt.genSaltSync(saltRounds);
    const hashedPassword = bcrypt.hashSync(password, salt);

    console.log("command started");

    // Insert user into database
    const db = mysql.createConnection({
        host: process.env.HOST,
        user: process.env.USER,
        password: process.env.PASSWORD,
      });

    await db.query('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', ['Test User', email, hashedPassword]);

    // Make login request
    const response = await request(app)
      .post('/login')
      .send({ email, password });

    // Expect response to have a token
    expect(response.status).toBe(200);
    expect(response.body.token).toBeDefined();

    // Delete user from database
    await db.query('DELETE FROM users WHERE email = ?', [email]);
  });

  it('should respond with 400 if email is invalid', async () => {
    const email = 'invalidemail'; // Invalid email address
    const password = 'Abcd1234!';

    const response = await request(app)
      .post('/login')
      .send({ email, password });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Invalid email');
  });

  it('should respond with 400 if password is invalid', async () => {
    const email = 'testuser@example.com';
    const password = 'invalidpassword'; // Password doesn't meet requirements

    const response = await request(app)
      .post('/login')
      .send({ email, password });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Invalid password');
  });

  it('should respond with 404 if user does not exist', async () => {
    const email = 'nonexistentuser@example.com';
    const password = 'Abcd1234!';

    const response = await request(app)
      .post('/login')
      .send({ email, password });

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('User not found');
  });

  it('should respond with 401 if password is incorrect', async () => {
    const email = 'testuser@example.com';
    const password = 'incorrectpassword';

    const response = await request(app)
      .post('/login')
      .send({ email, password });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Invalid password');
  });
});
