// routes/cardPageRoutes.js
const express = require('express');
const cardController = require('../controllers/cardController'); // Import the controller
const router = express.Router();

// --- Card Page Routes ---

// GET /browse - Renders the browse cards page
// Note: This path is relative to where it's mounted in server.js (e.g., /cards)
// So the full path will become /cards/browse
router.get('/browse', cardController.renderBrowsePage);

// Add other card-related page routes later (e.g., GET /cards/:id for single card view page)

module.exports = router; // Export the router
