// controllers/collectionController.js
const db = require('../config/db'); // Import database query function

/**
 * Adds a card to the logged-in user's collection.
 * If the card is already in the collection, increments the quantity.
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
    res.status(200).json({
      status: 'success',
      message: `Card added to collection.`
    });
    // Or redirect back if using simple form submission:
    // res.redirect('back');

  } catch (err) {
    console.error('Error adding card to collection:', err);
     res.status(500).json({ status: 'error', message: 'Failed to add card to collection.' });
     // Or pass to global error handler: next(err);
  }
};


/**
 * Fetches and renders the collection page for the logged-in user.
 */
exports.viewCollection = async (req, res, next) => {
  const userId = req.user?.id;

  if (!userId) {
    console.error('Error in viewCollection: User ID not found on request.');
    return res.redirect('/auth/login');
  }

  try {
    const query = `
      SELECT
        uc.id AS user_collection_id, -- ID of the entry in user_collections table
        uc.quantity,
        c.* -- All columns from the cards table
      FROM user_collections uc
      JOIN cards c ON uc.card_id = c.id
      WHERE uc.user_id = $1
      ORDER BY
        c.set_name ASC NULLS LAST,
        NULLIF(regexp_replace(c.card_number, '[^0-9]', '', 'g'), '')::int ASC NULLS LAST,
        c.card_number ASC NULLS LAST;
    `;

    const result = await db.query(query, [userId]);

    res.render('myCollection', {
      title: 'My Collection',
      collection: result.rows
    });

  } catch (err) {
    console.error('Error fetching user collection:', err);
    next(err);
  }
};


/**
 * Removes an item from the logged-in user's collection.
 * Expects user_collection_id as a URL parameter.
 * Expects user information attached by protectRoute middleware (req.user).
 */
exports.removeFromCollection = async (req, res, next) => {
  // Get the specific user_collections row ID from URL parameters
  const { userCollectionId } = req.params;
  // Get userId from the protectRoute middleware
  const userId = req.user?.id;

  // Validation
  if (!userId) {
    console.error('Error in removeFromCollection: User ID not found on request.');
    // Usually protectRoute handles this, but double-check
    return res.redirect('/auth/login');
  }
  if (!userCollectionId || isNaN(parseInt(userCollectionId, 10))) {
    console.error(`Error in removeFromCollection: Invalid userCollectionId: ${userCollectionId}`);
    // Handle appropriately - redirect back with error or send error status
    // Redirecting back is simple for now
    return res.redirect('/collection'); // Or res.redirect('back');
  }

  const userCollectionIdInt = parseInt(userCollectionId, 10);

  try {
    // Delete the specific row from user_collections
    // IMPORTANT: Also check user_id to ensure users can only delete their OWN items
    const deleteQuery = `
      DELETE FROM user_collections 
      WHERE id = $1 AND user_id = $2;
    `;

    const result = await db.query(deleteQuery, [userCollectionIdInt, userId]);

    if (result.rowCount === 0) {
      // If rowCount is 0, it means no row matched the id AND user_id.
      // This could happen if the user tries to delete something not theirs,
      // or if the item was already deleted.
      console.warn(`Attempted to delete non-existent or unauthorized collection item ${userCollectionIdInt} for user ${userId}`);
      // Optionally add a flash message here indicating failure/not found
    } else {
      console.log(`Collection item ID ${userCollectionIdInt} deleted for User ID ${userId}`);
      // Optionally add a flash message here indicating success
    }

    // Redirect back to the collection page after attempting deletion
    res.redirect('/collection');

  } catch (err) {
    console.error('Error removing card from collection:', err);
    next(err); // Pass error to the global error handler
  }
};


// TODO: Add functions later for updating quantity etc.
// exports.updateQuantity = async (req, res, next) => { ... };
