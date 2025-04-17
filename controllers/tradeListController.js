// controllers/tradeListController.js
const db = require('../config/db'); // Import database query function

/**
 * Displays the user's current trade list.
 * Fetches items marked for trade by joining trade_list, user_collections, and cards.
 */
exports.viewTradeList = async (req, res, next) => {
    const userId = req.user?.id; // From protectRoute middleware

    if (!userId) {
        // Should be caught by protectRoute, but good practice
        return res.redirect('/auth/login');
    }

    try {
        const query = `
            SELECT 
                tl.id AS trade_list_item_id, 
                tl.quantity_for_trade, 
                uc.quantity AS total_quantity, 
                uc.id AS user_collection_id,
                c.* -- Select all card details
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

        // Render a view (e.g., 'myTradeList.ejs' - needs creating)
        // Pass the fetched trade list items
        res.render('myTradeList', { // NOTE: We need to create views/myTradeList.ejs later
            title: 'My Trade List',
            tradeList: result.rows
        });

    } catch (err) {
        console.error('Error fetching user trade list:', err);
        next(err); // Pass error to global handler
    }
};

/**
 * Adds an item from the user's collection to their trade list.
 * Expects :userCollectionId in URL params.
 */
exports.addToTradeList = async (req, res, next) => {
    const { userCollectionId } = req.params;
    const userId = req.user?.id; // From protectRoute middleware
    // Optional: Get quantity from request body if allowing partial trade? Defaulting to 1 for now.
    const quantityForTrade = 1; // TODO: Make this configurable later?

    // Validation
    if (!userId) { return res.redirect('/auth/login'); } // Should be caught by protectRoute
    if (!userCollectionId || isNaN(parseInt(userCollectionId, 10))) {
        console.error(`addToTradeList: Invalid userCollectionId: ${userCollectionId}`);
        // TODO: Add user feedback (flash message)
        return res.redirect('back'); // Redirect to previous page
    }

    const userCollectionIdInt = parseInt(userCollectionId, 10);

    try {
        // 1. Verify the user actually owns this collection item
        const ownerCheck = await db.query(
            'SELECT quantity FROM user_collections WHERE id = $1 AND user_id = $2',
            [userCollectionIdInt, userId]
        );

        if (ownerCheck.rows.length === 0) {
            console.warn(`User ${userId} attempted to add unowned collection item ${userCollectionIdInt} to trade list.`);
            // TODO: Add user feedback
            return res.redirect('back');
        }

        // Optional: Check if quantity to trade exceeds owned quantity (if configurable)
        // const ownedQuantity = ownerCheck.rows[0].quantity;
        // if (quantityForTrade > ownedQuantity) { ... handle error ... }

        // 2. Check if it's already on the trade list (using ON CONFLICT is better)
        // const alreadyListedCheck = await db.query('SELECT id FROM trade_list WHERE user_collection_id = $1', [userCollectionIdInt]);
        // if (alreadyListedCheck.rows.length > 0) { ... handle already listed ... }

        // 3. Insert into trade_list, handle conflict if already listed
        const insertQuery = `
            INSERT INTO trade_list (user_collection_id, quantity_for_trade)
            VALUES ($1, $2)
            ON CONFLICT (user_collection_id) 
            DO UPDATE SET quantity_for_trade = EXCLUDED.quantity_for_trade; 
            -- Or DO NOTHING if you don't want to update quantity if re-added
        `;
        await db.query(insertQuery, [userCollectionIdInt, quantityForTrade]);

        console.log(`Collection item ID ${userCollectionIdInt} added/updated in trade list for User ID ${userId}`);
        // TODO: Add success feedback (flash message)
        res.redirect('back'); // Redirect to previous page (likely /collection)

    } catch (err) {
        console.error('Error adding item to trade list:', err);
        next(err);
    }
};

/**
 * Removes an item from the user's trade list.
 * Expects :tradeListItemId in URL params (ID from trade_list table).
 */
exports.removeFromTradeList = async (req, res, next) => {
    const { tradeListItemId } = req.params;
    const userId = req.user?.id; // From protectRoute middleware

    // Validation
    if (!userId) { return res.redirect('/auth/login'); } // Should be caught by protectRoute
    if (!tradeListItemId || isNaN(parseInt(tradeListItemId, 10))) {
        console.error(`removeFromTradeList: Invalid tradeListItemId: ${tradeListItemId}`);
        // TODO: Add user feedback
        return res.redirect('back');
    }

    const tradeListItemIdInt = parseInt(tradeListItemId, 10);

    try {
        // Delete the item from trade_list
        // We MUST ensure the item belongs to the logged-in user by joining through user_collections
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
            // TODO: Add user feedback
        } else {
            console.log(`Trade list item ID ${tradeListItemIdInt} deleted for User ID ${userId}`);
            // TODO: Add success feedback
        }

        res.redirect('back'); // Redirect to previous page (likely /tradelist or /collection)

    } catch (err) {
        console.error('Error removing item from trade list:', err);
        next(err);
    }
};
