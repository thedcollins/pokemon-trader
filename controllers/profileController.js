// controllers/profileController.js
const db = require('../config/db'); // Import database query function

/**
 * Fetches and renders the public profile page for a given username.
 * Displays the user's trade list and want list.
 */
exports.viewProfile = async (req, res, next) => {
    // 1. Get username from URL parameters
    const { username } = req.params;

    try {
        // 2. Find the user's ID based on the username
        const userQuery = 'SELECT id FROM users WHERE username = $1';
        const userResult = await db.query(userQuery, [username]);

        // Check if user was found
        if (userResult.rows.length === 0) {
            const error = new Error('User not found');
            error.status = 404;
            return next(error); // Pass to the global error handler -> renders error.ejs
        }

        const userId = userResult.rows[0].id;

        // 3. Fetch the user's public Trade List
        // (Similar query to tradeListController.viewTradeList but using the found userId)
        const tradeListQuery = `
            SELECT 
                tl.id AS trade_list_item_id, 
                tl.quantity_for_trade, 
                uc.quantity AS total_quantity, 
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
        const tradeListResult = await db.query(tradeListQuery, [userId]);

        // 4. Fetch the user's public Want List
        // (Similar query to wantListController.viewWantList but using the found userId)
        const wantListQuery = `
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
        const wantListResult = await db.query(wantListQuery, [userId]);

        // 5. Render the profile view (needs creating: views/profile.ejs)
        res.render('profile', { // NOTE: We need to create views/profile.ejs later
            title: `${username}'s Profile`,
            profileUsername: username, // Pass the username for display
            tradeList: tradeListResult.rows,
            wantList: wantListResult.rows
        });

    } catch (err) {
        console.error(`Error fetching profile for user ${username}:`, err);
        next(err); // Pass error to the global error handler
    }
};

