// controllers/authController.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken'); // Import jsonwebtoken
const db = require('../config/db'); // Import the database query function

const SALT_ROUNDS = 10; // Standard cost factor for bcrypt hashing
const JWT_EXPIRY = '1h'; // How long the login token should last (e.g., 1 hour)

// --- Registration Functions ---

// Function to render the registration page (GET /auth/register)
exports.renderRegisterPage = (req, res) => {
  res.render('register', {
    title: 'Register',
    error: null,
    formData: {}
  });
};

// Function to handle user registration form submission (POST /auth/register)
exports.registerUser = async (req, res) => {
  const { username, email, password, passwordConfirm } = req.body;
  const formData = { username, email };

  // Input Validation
  if (!username || !email || !password || !passwordConfirm) {
    return res.status(400).render('register', { title: 'Register', error: 'Please fill in all fields.', formData: formData });
  }
  if (password !== passwordConfirm) {
    return res.status(400).render('register', { title: 'Register', error: 'Passwords do not match.', formData: formData });
  }
  if (!email.includes('@')) {
      return res.status(400).render('register', { title: 'Register', error: 'Please enter a valid email address.', formData: formData });
  }
  // Add more validation if needed

  try {
    // Check if user already exists
    const existingUserCheck = await db.query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email.toLowerCase(), username]
    );

    if (existingUserCheck.rows.length > 0) {
      return res.status(400).render('register', { title: 'Register', error: 'Username or email already in use.', formData: formData });
    }

    // Hash the password
    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    // Insert the new user into the database
    const newUser = await db.query(
      'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username',
      [username, email.toLowerCase(), password_hash]
    );

    console.log('User registered successfully:', newUser.rows[0]);

    // Redirect to login page after successful registration
    res.redirect('/auth/login');

  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).render('register', { title: 'Register', error: 'An error occurred during registration. Please try again.', formData: formData });
  }
};

// --- Login Functions ---

// Function to render the login page (GET /auth/login)
exports.renderLoginPage = (req, res) => {
  res.render('login', {
    title: 'Login',
    error: null,
    formData: {}
  });
};

// Function to handle user login form submission (POST /auth/login)
exports.loginUser = async (req, res) => {
  const { identifier, password } = req.body;
  const formData = { identifier };

  // Basic Validation
  if (!identifier || !password) {
    return res.status(400).render('login', { title: 'Login', error: 'Please provide both identifier (email/username) and password.', formData: formData });
  }

  try {
    // Find user by email or username
    const userResult = await db.query(
      'SELECT id, username, email, password_hash FROM users WHERE lower(email) = lower($1) OR username = $1',
      [identifier]
    );

    // Check if user exists
    if (userResult.rows.length === 0) {
      return res.status(401).render('login', { title: 'Login', error: 'Invalid credentials.', formData: formData });
    }

    const user = userResult.rows[0];

    // Compare submitted password with stored hash
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).render('login', { title: 'Login', error: 'Invalid credentials.', formData: formData });
    }

    // Password matches - Generate JWT
    const payload = { userId: user.id, username: user.username };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: JWT_EXPIRY });

    // Set JWT in an HTTP-Only cookie
    res.cookie('token', token, {
      httpOnly: true, // Prevents client-side JS access
      secure: process.env.NODE_ENV === 'production', // Send only over HTTPS in production
      maxAge: 3600000, // Cookie expiry in ms (1 hour)
      path: '/' // Ensure cookie path is root
      // sameSite: 'strict' // Consider adding SameSite attribute
    });

    // Redirect to home page after successful login
    res.redirect('/');

  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).render('login', { title: 'Login', error: 'An error occurred during login. Please try again.', formData: formData });
  }
};

// --- Logout Function --- << NEW

// Function to handle user logout (GET /auth/logout)
exports.logoutUser = (req, res) => {
  // Clear the 'token' cookie.
  // It's good practice to pass the same options used when setting the cookie
  // to ensure it's properly cleared, especially 'path'.
  res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/'
      // sameSite: 'strict' // Match if you used it when setting
  });

  // Redirect the user to the login page (or home page)
  res.redirect('/auth/login');
};
