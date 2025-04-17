// routes/tradeListRoutes.js
const express = require('express');
// Import the controller (we will create functions in it next)
const tradeListController = require('../controllers/tradeListController');
// Import the middleware to protect routes
const { protectRoute } = require('../middleware/authMiddleware');
// Create an Express router instance
const router = express.Router();

// --- Trade List Routes ---
// All routes defined here will likely be prefixed with /tradelist (or similar) in server.js

// GET /tradelist - Display the logged-in user's trade list page (Protected)
// We'll need a controller function 'viewTradeList' for this
router.get('/', protectRoute, tradeListController.viewTradeList);

// POST /tradelist/add/:userCollectionId - Mark an item from user's collection for trade (Protected)
// :userCollectionId refers to the ID in the user_collections table
// We'll need a controller function 'addToTradeList' for this
router.post('/add/:userCollectionId', protectRoute, tradeListController.addToTradeList);

// POST /tradelist/remove/:tradeListItemId - Remove an item from the trade list (Protected)
// :tradeListItemId refers to the ID in the trade_list table itself
// We'll need a controller function 'removeFromTradeList' for this
router.post('/remove/:tradeListItemId', protectRoute, tradeListController.removeFromTradeList);


// Export the router
module.exports = router;
