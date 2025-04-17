// controllers/cardController.js
const db = require('../config/db'); // Import database query function

/**
 * Fetches all cards from the database for the API endpoint.
 * Responds with JSON data.
 */
exports.getAllCards = async (req, res, next) => {
  try {
    // Query to select all columns from the cards table
    // Order by set_name and then attempt to order by card_number
    const query = `
      SELECT * FROM cards 
      ORDER BY 
        set_name ASC NULLS LAST, 
        NULLIF(regexp_replace(card_number, '[^0-9]', '', 'g'), '')::int ASC NULLS LAST, 
        card_number ASC NULLS LAST;
    `;
    
    const result = await db.query(query);
    
    // Send the fetched rows back as a JSON response
    res.status(200).json({
      status: 'success',
      count: result.rows.length,
      cards: result.rows,
    });
  } catch (err) {
    console.error('Error fetching cards for API:', err);
    // Pass error to the global error handler in server.js
    next(err); 
  }
};


/**
 * Fetches all cards from the database and renders the browse page view.
 * Passes card data to the EJS template.
 */
exports.renderBrowsePage = async (req, res, next) => {
  try {
    // Use the same query as getAllCards to fetch the data
    const query = `
      SELECT * FROM cards 
      ORDER BY 
        set_name ASC NULLS LAST, 
        NULLIF(regexp_replace(card_number, '[^0-9]', '', 'g'), '')::int ASC NULLS LAST, 
        card_number ASC NULLS LAST;
    `;

    const result = await db.query(query);

    // Render the 'browse.ejs' template from the 'views' folder
    // Pass the fetched cards array and a title to the template
    res.render('browse', {
      title: 'Browse Cards',
      cards: result.rows // The array of card objects from the database
    });

  } catch (err) {
    console.error('Error fetching cards for browse page:', err);
    // Pass error to the global error handler in server.js
    next(err);
  }
};


// TODO: Add other functions later (e.g., getCardById, searchCards)

