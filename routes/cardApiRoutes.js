// routes/cardApiRoutes.js
const express = require('express');
const cardController = require('../controllers/cardController'); // Import the controller
const router = express.Router();

// --- Card API Routes ---

// GET /cards - Fetches all cards as JSON
// Note: This path is relative to where it's mounted in server.js (e.g., /api)
// So the full path will become /api/cards
router.get('/cards', cardController.getAllCards);

// Add other API-related card routes later (e.g., GET /api/cards/:id)

module.exports = router; // Export the router
