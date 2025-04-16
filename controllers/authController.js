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
    return res.status(400).render('register', {
      title: 'Register',
      error: 'Please fill in all fields.',
      formData: formData
    });
  }
  if (password !== passwordConfirm) {
    return res.status(400).render('register', {
      title: 'Register',
      error: 'Passwords do not match.',
      formData: formData
    });
  }
  if (!email.includes('@')) {
      return res.status(400).render('register', {
          title: 'Register',
          error: 'Please enter a valid email address.',
          formData: formData
      });
  }
  // Add more validation if needed

  try {
    // Check if user already exists
    const existingUserCheck = await db.query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email.toLowerCase(), username]
    );

    if (existingUserCheck.rows.length > 0) {
      return res.status(400).render('register', {
        title: 'Register',
        error: 'Username or email already in use.',
        formData: formData
      });
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
    // TODO: Implement flash messages for a better success indication
    res.redirect('/auth/login'); // Redirect to the login page

  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).render('register', {
        title: 'Register',
        error: 'An error occurred during registration. Please try again.',
        formData: formData
    });
  }
};

// --- Login Functions ---

// Function to render the login page (GET /auth/login)
exports.renderLoginPage = (req, res) => {
  // Render the login.ejs view
  res.render('login', {
    title: 'Login',
    error: null, // No error initially
    formData: {} // No form data initially
  });
};

// Function to handle user login form submission (POST /auth/login)
exports.loginUser = async (req, res) => {
  // 1. Get email/username and password from request body
  // Allow login with either email or username (adjust query accordingly)
  const { identifier, password } = req.body; // Using 'identifier' for email/username field name
  const formData = { identifier }; // Store identifier to refill form on error

  // 2. Basic Validation
  if (!identifier || !password) {
    return res.status(400).render('login', {
      title: 'Login',
      error: 'Please provide both identifier (email/username) and password.',
      formData: formData
    });
  }

  try {
    // 3. Find user by email or username
    // Query users table for matching email (case-insensitive) or username
    const userResult = await db.query(
      'SELECT id, username, email, password_hash FROM users WHERE lower(email) = lower($1) OR username = $1',
      [identifier]
    );

    // Check if user exists
    if (userResult.rows.length === 0) {
      // User not found
      return res.status(401).render('login', { // 401 Unauthorized
        title: 'Login',
        error: 'Invalid credentials.', // Generic error for security
        formData: formData
      });
    }

    const user = userResult.rows[0];

    // 4. Compare submitted password with stored hash
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      // Passwords don't match
      return res.status(401).render('login', { // 401 Unauthorized
        title: 'Login',
        error: 'Invalid credentials.', // Generic error for security
        formData: formData
      });
    }

    // 5. Password matches - Generate JWT
    const payload = {
      userId: user.id,
      username: user.username
      // Add other non-sensitive info if needed (e.g., roles)
    };

    // Sign the token using the secret from .env and set expiration
    const token = jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: JWT_EXPIRY }
    );

    // 6. Set JWT in an HTTP-Only cookie
    res.cookie('token', token, {
      httpOnly: true, // Crucial: Prevents client-side JS access
      secure: process.env.NODE_ENV === 'production', // Send only over HTTPS in production
      maxAge: 3600000, // Cookie expiry in milliseconds (e.g., 1 hour to match JWT)
      // sameSite: 'strict' // Consider adding SameSite attribute for CSRF protection
    });

    // 7. Redirect to a dashboard or home page after successful login
    // TODO: Create a dashboard page to redirect to
    res.redirect('/'); // Redirect to home page for now

  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).render('login', {
      title: 'Login',
      error: 'An error occurred during login. Please try again.',
      formData: formData
    });
  }
};


// --- TODO: Add Logout Function Later ---
// exports.logoutUser = (req, res) => {
//   res.clearCookie('token'); // Clear the token cookie
//   res.redirect('/auth/login'); // Redirect to login page
// };
