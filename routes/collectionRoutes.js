// routes/collectionRoutes.js
const express = require('express');
const collectionController = require('../controllers/collectionController');
// Import the specific middleware needed
const { protectRoute } = require('../middleware/authMiddleware');
const router = express.Router();

// --- Collection Routes ---
// All routes defined here will be prefixed with /collection (as mounted in server.js)

// GET /collection - Display the logged-in user's collection page
// Uses protectRoute middleware first, then the viewCollection controller function
router.get('/', protectRoute, collectionController.viewCollection);

// POST /collection/add/:cardId - Add a card to the logged-in user's collection
// Also uses protectRoute middleware first
router.post('/add/:cardId', protectRoute, collectionController.addToCollection);

// POST /collection/remove/:userCollectionId - Remove an item from the collection << NEW
// Uses protectRoute middleware first
// :userCollectionId is a URL parameter representing the ID of the row in the user_collections table
router.post('/remove/:userCollectionId', protectRoute, collectionController.removeFromCollection);


// TODO: Add routes later for updating quantity etc.


// Export the router
module.exports = router;
