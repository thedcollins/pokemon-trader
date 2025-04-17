// routes/wantListRoutes.js
const express = require('express');
// Import the controller (we will create functions in it next)
const wantListController = require('../controllers/wantListController');
// Import the middleware to protect routes
const { protectRoute } = require('../middleware/authMiddleware');
// Create an Express router instance
const router = express.Router();

// --- Want List Routes ---
// All routes defined here will likely be prefixed with /wantlist (or similar) in server.js

// GET /wantlist - Display the logged-in user's want list page (Protected)
// We'll need a controller function 'viewWantList' for this
router.get('/', protectRoute, wantListController.viewWantList);

// POST /wantlist/add/:cardId - Add a card (by its main card ID) to the want list (Protected)
// :cardId refers to the ID in the main 'cards' table
// We'll need a controller function 'addToWantList' for this
router.post('/add/:cardId', protectRoute, wantListController.addToWantList);

// POST /wantlist/remove/:wantListItemId - Remove an item from the want list (Protected)
// :wantListItemId refers to the ID in the 'want_list' table itself
// We'll need a controller function 'removeFromWantList' for this
router.post('/remove/:wantListItemId', protectRoute, wantListController.removeFromWantList);


// Export the router
module.exports = router;
