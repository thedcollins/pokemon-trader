// controllers/collectionController.js
const db = require('../config/db'); // Import database query function

/**
 * Adds a card to the logged-in user's collection.
 * If the card is already in the collection, increments the quantity.
 * Returns JSON response.
 */
exports.addToCollection = async (req, res, next) => {
  const { cardId } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    console.error('Error in addToCollection: User ID not found on request.');
    // Return JSON error for AJAX
    return res.status(401).json({ status: 'error', message: 'Authentication required.' });
  }
  if (!cardId || isNaN(parseInt(cardId, 10))) {
    console.error(`Error in addToCollection: Invalid cardId received: ${cardId}`);
    // Return JSON error for AJAX
    return res.status(400).json({ status: 'error', message: 'Invalid card ID provided.' });
  }

  const cardIdInt = parseInt(cardId, 10);

  try {
    const cardCheck = await db.query('SELECT id FROM cards WHERE id = $1', [cardIdInt]);
    if (cardCheck.rows.length === 0) {
        // Return JSON error for AJAX
        return res.status(404).json({ status: 'error', message: 'Card not found in database.' });
    }

    const insertQuery = `
      INSERT INTO user_collections (user_id, card_id, quantity)
      VALUES ($1, $2, 1)
      ON CONFLICT (user_id, card_id)
      DO UPDATE SET quantity = user_collections.quantity + 1
      RETURNING quantity; -- Optionally return the new quantity
    `;
    // Get the potentially updated quantity
    const result = await db.query(insertQuery, [userId, cardIdInt]);
    const newQuantity = result.rows[0]?.quantity; // May not return if INSERT happened without conflict returning clause, adjust if needed

    console.log(`Card ID ${cardIdInt} added/incremented for User ID ${userId}`);

    // Send a JSON success response instead of redirecting
    res.status(200).json({
      status: 'success',
      message: `Card added/updated in collection.`,
      cardId: cardIdInt, // Send back cardId for potential UI updates
      newQuantity: newQuantity // Send back new quantity if available
    });

  } catch (err) {
    console.error('Error adding card to collection:', err);
     // Return JSON error for AJAX
     res.status(500).json({ status: 'error', message: 'Failed to add card to collection.' });
     // Or pass to global error handler: next(err); (less common for API endpoints)
  }
};


/**
 * Fetches and renders the collection page for the logged-in user.
 * (This function remains unchanged as it renders a page, not an API response)
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
        uc.id AS user_collection_id,
        uc.quantity,
        c.*
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
 * Returns JSON response.
 */
exports.removeFromCollection = async (req, res, next) => {
  const { userCollectionId } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    console.error('Error in removeFromCollection: User ID not found on request.');
     // Return JSON error for AJAX
    return res.status(401).json({ status: 'error', message: 'Authentication required.' });
  }
  if (!userCollectionId || isNaN(parseInt(userCollectionId, 10))) {
    console.error(`Error in removeFromCollection: Invalid userCollectionId: ${userCollectionId}`);
     // Return JSON error for AJAX
    return res.status(400).json({ status: 'error', message: 'Invalid collection item ID.' });
  }

  const userCollectionIdInt = parseInt(userCollectionId, 10);

  try {
    // Delete the specific row from user_collections, ensuring it belongs to the user
    const deleteQuery = `
      DELETE FROM user_collections
      WHERE id = $1 AND user_id = $2;
    `;

    const result = await db.query(deleteQuery, [userCollectionIdInt, userId]);

    if (result.rowCount === 0) {
      // If rowCount is 0, item didn't exist or didn't belong to user
      console.warn(`Attempted to delete non-existent or unauthorized collection item ${userCollectionIdInt} for user ${userId}`);
      // Return JSON error for AJAX
      return res.status(404).json({ status: 'error', message: 'Item not found in collection or not authorized.' });
    } else {
      console.log(`Collection item ID ${userCollectionIdInt} deleted for User ID ${userId}`);
      // Send JSON success response instead of redirecting
      return res.status(200).json({ status: 'success', message: 'Item removed from collection.', removedId: userCollectionIdInt });
    }

  } catch (err) {
    console.error('Error removing card from collection:', err);
     // Return JSON error for AJAX
     res.status(500).json({ status: 'error', message: 'Failed to remove item from collection.' });
     // Or pass to global error handler: next(err);
  }
};

// TODO: Add functions later for updating quantity etc.
