// controllers/collectionController.js
const db = require('../config/db'); // Import database query function

/**
 * Adds a card to the logged-in user's collection.
 * If the card is already in the collection, increments the quantity.
 * Expects cardId as a URL parameter.
 * Expects user information attached by protectRoute middleware (req.user).
 */
exports.addToCollection = async (req, res, next) => {
  const { cardId } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    console.error('Error in addToCollection: User ID not found on request.');
    return res.status(401).json({ status: 'error', message: 'Authentication required.' });
  }
  if (!cardId || isNaN(parseInt(cardId, 10))) {
    console.error(`Error in addToCollection: Invalid cardId received: ${cardId}`);
    return res.status(400).json({ status: 'error', message: 'Invalid card ID provided.' });
  }

  const cardIdInt = parseInt(cardId, 10);

  try {
    const cardCheck = await db.query('SELECT id FROM cards WHERE id = $1', [cardIdInt]);
    if (cardCheck.rows.length === 0) {
        return res.status(404).json({ status: 'error', message: 'Card not found in database.' });
    }

    const insertQuery = `
      INSERT INTO user_collections (user_id, card_id, quantity)
      VALUES ($1, $2, 1)
      ON CONFLICT (user_id, card_id)
      DO UPDATE SET quantity = user_collections.quantity + 1;
    `;
    await db.query(insertQuery, [userId, cardIdInt]);

    console.log(`Card ID ${cardIdInt} added/incremented for User ID ${userId}`);

    // Send a success response (JSON suitable for background requests)
    // For simple form submissions, you might redirect back instead:
    // return res.redirect('back'); // Redirects to the previous page
    res.status(200).json({
      status: 'success',
      message: `Card added to collection.`
    });

  } catch (err) {
    console.error('Error adding card to collection:', err);
    // For API-like responses, send a JSON error
     res.status(500).json({ status: 'error', message: 'Failed to add card to collection.' });
     // Or pass to global error handler: next(err);
  }
};


/**
 * Fetches and renders the collection page for the logged-in user.
 * Expects user information attached by protectRoute middleware (req.user).
 */
exports.viewCollection = async (req, res, next) => {
  const userId = req.user?.id; // Get user ID from protectRoute middleware

  if (!userId) {
    // Should be caught by protectRoute, but double-check
    console.error('Error in viewCollection: User ID not found on request.');
    return res.redirect('/auth/login');
  }

  try {
    // Query to get collection items for the user, joining with cards table for details
    // Select user_collections.id as user_collection_id for potential delete/update actions later
    // Select quantity from user_collections
    // Select all details (*) from the cards table
    const query = `
      SELECT 
        uc.id AS user_collection_id, 
        uc.quantity, 
        c.* FROM user_collections uc 
      JOIN cards c ON uc.card_id = c.id 
      WHERE uc.user_id = $1 
      ORDER BY 
        c.set_name ASC NULLS LAST, 
        NULLIF(regexp_replace(c.card_number, '[^0-9]', '', 'g'), '')::int ASC NULLS LAST, 
        c.card_number ASC NULLS LAST;
    `;

    const result = await db.query(query, [userId]);

    // Render the 'myCollection.ejs' view (we'll create this next)
    // Pass the fetched collection data (array of card objects with quantity)
    res.render('myCollection', {
      title: 'My Collection',
      collection: result.rows // The array of collection items
    });

  } catch (err) {
    console.error('Error fetching user collection:', err);
    next(err); // Pass error to the global error handler
  }
};


// TODO: Add functions later for removing items, updating quantity etc.
// exports.removeFromCollection = async (req, res, next) => { ... };
// exports.updateQuantity = async (req, res, next) => { ... };
