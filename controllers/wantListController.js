// controllers/wantListController.js
const db = require('../config/db'); // Import database query function

/**
 * Displays the user's current want list.
 * (This function remains unchanged as it renders a page)
 */
exports.viewWantList = async (req, res, next) => {
    const userId = req.user?.id;

    if (!userId) {
        return res.redirect('/auth/login');
    }

    try {
        const query = `
            SELECT
                wl.id AS want_list_item_id,
                c.*
            FROM want_list wl
            JOIN cards c ON wl.card_id = c.id
            WHERE wl.user_id = $1
            ORDER BY
                c.set_name ASC NULLS LAST,
                NULLIF(regexp_replace(c.card_number, '[^0-9]', '', 'g'), '')::int ASC NULLS LAST,
                c.card_number ASC NULLS LAST;
        `;
        const result = await db.query(query, [userId]);

        res.render('myWantList', {
            title: 'My Want List',
            wantList: result.rows
        });

    } catch (err) {
        console.error('Error fetching user want list:', err);
        next(err);
    }
};

/**
 * Adds a card (by its card_id) to the logged-in user's want list.
 * Returns JSON response.
 */
exports.addToWantList = async (req, res, next) => {
    const { cardId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
        return res.status(401).json({ status: 'error', message: 'Authentication required.' });
    }
    if (!cardId || isNaN(parseInt(cardId, 10))) {
        console.error(`addToWantList: Invalid cardId: ${cardId}`);
        return res.status(400).json({ status: 'error', message: 'Invalid card ID provided.' });
    }

    const cardIdInt = parseInt(cardId, 10);

    try {
        // Verify the card actually exists
        const cardCheck = await db.query('SELECT id FROM cards WHERE id = $1', [cardIdInt]);
        if (cardCheck.rows.length === 0) {
             console.warn(`User ${userId} attempted to add non-existent card ${cardIdInt} to want list.`);
             return res.status(404).json({ status: 'error', message: 'Card not found.' });
        }

        // Insert into want_list, ignore if already exists
        const insertQuery = `
            INSERT INTO want_list (user_id, card_id)
            VALUES ($1, $2)
            ON CONFLICT (user_id, card_id)
            DO NOTHING
            RETURNING id; -- Return ID if inserted, null if conflict
        `;
        const result = await db.query(insertQuery, [userId, cardIdInt]);

        if (result.rowCount > 0 && result.rows[0]?.id) {
            console.log(`Card ID ${cardIdInt} added to want list for User ID ${userId}`);
             // Send JSON success response
             res.status(200).json({ status: 'success', message: 'Card added to want list.', cardId: cardIdInt });
        } else {
            console.log(`Card ID ${cardIdInt} was already in want list for User ID ${userId}`);
             // Send JSON response indicating it already existed (could be success or neutral)
             res.status(200).json({ status: 'neutral', message: 'Card already in want list.', cardId: cardIdInt });
        }

        // REMOVED: res.redirect('back');

    } catch (err) {
        console.error('Error adding item to want list:', err);
        // Send JSON error response
        res.status(500).json({ status: 'error', message: 'Failed to add item to want list.' });
        // Or next(err);
    }
};

/**
 * Removes an item from the user's want list.
 * Returns JSON response.
 */
exports.removeFromWantList = async (req, res, next) => {
    const { wantListItemId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
        return res.status(401).json({ status: 'error', message: 'Authentication required.' });
    }
    if (!wantListItemId || isNaN(parseInt(wantListItemId, 10))) {
        console.error(`removeFromWantList: Invalid wantListItemId: ${wantListItemId}`);
        return res.status(400).json({ status: 'error', message: 'Invalid want list item ID.' });
    }

    const wantListItemIdInt = parseInt(wantListItemId, 10);

    try {
        // Delete the item from want_list, ensuring it belongs to the logged-in user
        const deleteQuery = `
            DELETE FROM want_list
            WHERE id = $1 AND user_id = $2;
        `;
        const result = await db.query(deleteQuery, [wantListItemIdInt, userId]);

        if (result.rowCount === 0) {
            console.warn(`Attempted to delete non-existent or unauthorized want list item ${wantListItemIdInt} for user ${userId}`);
            // Return JSON error response
            return res.status(404).json({ status: 'error', message: 'Item not found in want list or not authorized.' });
        } else {
            console.log(`Want list item ID ${wantListItemIdInt} deleted for User ID ${userId}`);
            // Send JSON success response instead of redirecting
            return res.status(200).json({ status: 'success', message: 'Item removed from want list.', removedId: wantListItemIdInt });
        }

        // REMOVED: res.redirect('back');

    } catch (err) {
        console.error('Error removing item from want list:', err);
         // Send JSON error response
         res.status(500).json({ status: 'error', message: 'Failed to remove item from want list.' });
        // Or next(err);
    }
};
