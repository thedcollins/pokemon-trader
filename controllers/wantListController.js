// controllers/wantListController.js
const db = require('../config/db'); // Import database query function

/**
 * Displays the user's current want list.
 * Fetches cards listed in want_list by joining with the cards table.
 */
exports.viewWantList = async (req, res, next) => {
    const userId = req.user?.id; // From protectRoute middleware

    if (!userId) {
        // Should be caught by protectRoute, but good practice
        return res.redirect('/auth/login');
    }

    try {
        const query = `
            SELECT 
                wl.id AS want_list_item_id, 
                c.* -- Select all card details
            FROM want_list wl 
            JOIN cards c ON wl.card_id = c.id 
            WHERE wl.user_id = $1 
            ORDER BY 
                c.set_name ASC NULLS LAST, 
                NULLIF(regexp_replace(c.card_number, '[^0-9]', '', 'g'), '')::int ASC NULLS LAST, 
                c.card_number ASC NULLS LAST;
        `;
        const result = await db.query(query, [userId]);

        // Render a view (e.g., 'myWantList.ejs' - needs creating)
        // Pass the fetched want list items
        res.render('myWantList', { // NOTE: We need to create views/myWantList.ejs later
            title: 'My Want List',
            wantList: result.rows
        });

    } catch (err) {
        console.error('Error fetching user want list:', err);
        next(err); // Pass error to global handler
    }
};

/**
 * Adds a card (by its card_id) to the logged-in user's want list.
 * Expects :cardId in URL params.
 */
exports.addToWantList = async (req, res, next) => {
    const { cardId } = req.params;
    const userId = req.user?.id; // From protectRoute middleware

    // Validation
    if (!userId) { return res.redirect('/auth/login'); } // Should be caught by protectRoute
    if (!cardId || isNaN(parseInt(cardId, 10))) {
        console.error(`addToWantList: Invalid cardId: ${cardId}`);
        // TODO: Add user feedback (flash message)
        return res.redirect('back'); // Redirect to previous page
    }

    const cardIdInt = parseInt(cardId, 10);

    try {
        // 1. Verify the card actually exists in the main cards table (optional but good practice)
        const cardCheck = await db.query('SELECT id FROM cards WHERE id = $1', [cardIdInt]);
        if (cardCheck.rows.length === 0) {
             console.warn(`User ${userId} attempted to add non-existent card ${cardIdInt} to want list.`);
             // TODO: Add user feedback
            return res.redirect('back');
        }

        // 2. Insert into want_list, ignore if already exists
        // ON CONFLICT (user_id, card_id) DO NOTHING prevents duplicates for the same user/card
        const insertQuery = `
            INSERT INTO want_list (user_id, card_id)
            VALUES ($1, $2)
            ON CONFLICT (user_id, card_id) 
            DO NOTHING; 
        `;
        const result = await db.query(insertQuery, [userId, cardIdInt]);

        if (result.rowCount > 0) {
            console.log(`Card ID ${cardIdInt} added to want list for User ID ${userId}`);
            // TODO: Add success feedback (flash message)
        } else {
            console.log(`Card ID ${cardIdInt} was already in want list for User ID ${userId}`);
            // TODO: Add 'already exists' feedback (flash message)
        }

        res.redirect('back'); // Redirect to previous page (likely /cards/browse)

    } catch (err) {
        console.error('Error adding item to want list:', err);
        next(err);
    }
};

/**
 * Removes an item from the user's want list.
 * Expects :wantListItemId in URL params (ID from want_list table).
 */
exports.removeFromWantList = async (req, res, next) => {
    const { wantListItemId } = req.params;
    const userId = req.user?.id; // From protectRoute middleware

    // Validation
    if (!userId) { return res.redirect('/auth/login'); } // Should be caught by protectRoute
    if (!wantListItemId || isNaN(parseInt(wantListItemId, 10))) {
        console.error(`removeFromWantList: Invalid wantListItemId: ${wantListItemId}`);
        // TODO: Add user feedback
        return res.redirect('back');
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
            // TODO: Add user feedback
        } else {
            console.log(`Want list item ID ${wantListItemIdInt} deleted for User ID ${userId}`);
            // TODO: Add success feedback
        }

        res.redirect('back'); // Redirect to previous page (likely /wantlist)

    } catch (err) {
        console.error('Error removing item from want list:', err);
        next(err);
    }
};
