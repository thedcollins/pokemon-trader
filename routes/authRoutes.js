// routes/authRoutes.js
const express = require('express');
// Import the controller functions
const authController = require('../controllers/authController');
// Create an Express router instance
const router = express.Router();

// --- Authentication Routes ---

// GET /auth/register - Display the registration page
router.get('/register', authController.renderRegisterPage);

// POST /auth/register - Handle the registration form submission
router.post('/register', authController.registerUser);

// GET /auth/login - Display the login page
router.get('/login', authController.renderLoginPage);

// POST /auth/login - Handle the login form submission
router.post('/login', authController.loginUser);

// GET /auth/logout - Handle user logout << NEW
router.get('/logout', authController.logoutUser);


// Export the router so it can be used in server.js
module.exports = router;
