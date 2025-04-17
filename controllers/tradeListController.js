// controllers/tradeListController.js
const db = require('../config/db'); // Import database query function

/**
 * Displays the user's current trade list.
 * (This function remains unchanged as it renders a page)
 */
exports.viewTradeList = async (req, res, next) => {
    const userId = req.user?.id;

    if (!userId) {
        return res.redirect('/auth/login');
    }

    try {
        const query = `
            SELECT
                tl.id AS trade_list_item_id,
                tl.quantity_for_trade,
                uc.quantity AS total_quantity,
                uc.id AS user_collection_id,
                c.*
            FROM trade_list tl
            JOIN user_collections uc ON tl.user_collection_id = uc.id
            JOIN cards c ON uc.card_id = c.id
            WHERE uc.user_id = $1
            ORDER BY
                c.set_name ASC NULLS LAST,
                NULLIF(regexp_replace(c.card_number, '[^0-9]', '', 'g'), '')::int ASC NULLS LAST,
                c.card_number ASC NULLS LAST;
        `;
        const result = await db.query(query, [userId]);

        res.render('myTradeList', {
            title: 'My Trade List',
            tradeList: result.rows
        });

    } catch (err) {
        console.error('Error fetching user trade list:', err);
        next(err);
    }
};

/**
 * Adds an item from the user's collection to their trade list.
 * Returns JSON response.
 */
exports.addToTradeList = async (req, res, next) => {
    const { userCollectionId } = req.params;
    const userId = req.user?.id;
    const quantityForTrade = 1; // Keeping this simple for now

    if (!userId) {
        return res.status(401).json({ status: 'error', message: 'Authentication required.' });
    }
    if (!userCollectionId || isNaN(parseInt(userCollectionId, 10))) {
        console.error(`addToTradeList: Invalid userCollectionId: ${userCollectionId}`);
        return res.status(400).json({ status: 'error', message: 'Invalid collection item ID.' });
    }

    const userCollectionIdInt = parseInt(userCollectionId, 10);

    try {
        // Verify the user actually owns this collection item
        const ownerCheck = await db.query(
            'SELECT quantity FROM user_collections WHERE id = $1 AND user_id = $2',
            [userCollectionIdInt, userId]
        );

        if (ownerCheck.rows.length === 0) {
            console.warn(`User ${userId} attempted to add unowned collection item ${userCollectionIdInt} to trade list.`);
            return res.status(404).json({ status: 'error', message: 'Collection item not found or not authorized.' });
        }

        // Insert into trade_list, handle conflict
        const insertQuery = `
            INSERT INTO trade_list (user_collection_id, quantity_for_trade)
            VALUES ($1, $2)
            ON CONFLICT (user_collection_id)
            DO UPDATE SET quantity_for_trade = EXCLUDED.quantity_for_trade
            RETURNING id; -- Return the trade list item ID
        `;
        const result = await db.query(insertQuery, [userCollectionIdInt, quantityForTrade]);
        const tradeListItemId = result.rows[0]?.id;

        console.log(`Collection item ID ${userCollectionIdInt} added/updated in trade list for User ID ${userId}`);

        // Send JSON success response instead of redirecting
        res.status(200).json({
            status: 'success',
            message: 'Item added to trade list.',
            userCollectionId: userCollectionIdInt,
            tradeListItemId: tradeListItemId // Send back the ID in the trade_list table
        });

    } catch (err) {
        console.error('Error adding item to trade list:', err);
        // Send JSON error response
        res.status(500).json({ status: 'error', message: 'Failed to add item to trade list.' });
        // Or next(err);
    }
};

/**
 * Removes an item from the user's trade list.
 * Returns JSON response.
 */
exports.removeFromTradeList = async (req, res, next) => {
    const { tradeListItemId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
        return res.status(401).json({ status: 'error', message: 'Authentication required.' });
    }
    if (!tradeListItemId || isNaN(parseInt(tradeListItemId, 10))) {
        console.error(`removeFromTradeList: Invalid tradeListItemId: ${tradeListItemId}`);
        return res.status(400).json({ status: 'error', message: 'Invalid trade list item ID.' });
    }

    const tradeListItemIdInt = parseInt(tradeListItemId, 10);

    try {
        // Delete the item from trade_list, ensuring it belongs to the logged-in user
        const deleteQuery = `
            DELETE FROM trade_list tl
            USING user_collections uc
            WHERE tl.id = $1
              AND tl.user_collection_id = uc.id
              AND uc.user_id = $2;
        `;
        const result = await db.query(deleteQuery, [tradeListItemIdInt, userId]);

        if (result.rowCount === 0) {
            console.warn(`Attempted to delete non-existent or unauthorized trade list item ${tradeListItemIdInt} for user ${userId}`);
            // Return JSON error response
            return res.status(404).json({ status: 'error', message: 'Item not found in trade list or not authorized.' });
        } else {
            console.log(`Trade list item ID ${tradeListItemIdInt} deleted for User ID ${userId}`);
            // Send JSON success response instead of redirecting
            return res.status(200).json({ status: 'success', message: 'Item removed from trade list.', removedId: tradeListItemIdInt });
        }

    } catch (err) {
        console.error('Error removing item from trade list:', err);
        // Send JSON error response
        res.status(500).json({ status: 'error', message: 'Failed to remove item from trade list.' });
        // Or next(err);
    }
};
