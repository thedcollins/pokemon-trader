// routes/profileRoutes.js
const express = require('express');
// Import the controller (we will create functions in it next)
const profileController = require('../controllers/profileController');
// Create an Express router instance
const router = express.Router();

// --- Public Profile Route ---
// All routes defined here will likely be prefixed with /profile (as mounted in server.js)

// GET /profile/:username - Display a specific user's public profile (trade/want lists)
// :username is a URL parameter captured by Express
// This route is public, so no 'protectRoute' middleware is needed here.
router.get('/:username', profileController.viewProfile);


// Export the router
module.exports = router;
