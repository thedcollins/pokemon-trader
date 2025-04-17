// routes/collectionRoutes.js
const express = require('express');
const collectionController = require('../controllers/collectionController');
// Import the specific middleware needed
const { protectRoute } = require('../middleware/authMiddleware');
const router = express.Router();

// --- Collection Routes ---
// All routes defined here will be prefixed with /collection (as mounted in server.js)

// GET /collection - Display the logged-in user's collection page << NEW
// Uses protectRoute middleware first, then the viewCollection controller function
router.get('/', protectRoute, collectionController.viewCollection);

// POST /collection/add/:cardId - Add a card to the logged-in user's collection
// Also uses protectRoute middleware first
router.post('/add/:cardId', protectRoute, collectionController.addToCollection);


// TODO: Add routes later for removing items, updating quantity etc.
// router.post('/remove/:userCollectionId', protectRoute, collectionController.removeFromCollection);


// Export the router
module.exports = router;
