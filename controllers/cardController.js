// controllers/cardController.js
const db = require('../config/db'); // Import database query function

/**
 * Fetches cards from the database for the API endpoint.
 * Optionally filters by card_name based on the 'search' query parameter.
 * Responds with JSON data.
 */
exports.getAllCards = async (req, res, next) => {
  // Get the search term from the query string (e.g., /api/cards?search=pika)
  const searchTerm = req.query.search || ''; // Default to empty string
  const queryParams = [];
  let whereClause = '';

  // Base query
  let query = `
      SELECT * FROM cards
  `;

  // If a search term exists, add a WHERE clause to filter by card_name
  if (searchTerm) {
    // Use ILIKE for case-insensitive matching
    // Use % wildcard to match partial names (contains)
    whereClause = `WHERE card_name ILIKE $1`;
    // Add the search term (with wildcards) to the parameters array
    queryParams.push(`%${searchTerm}%`);
  }

  // Append WHERE clause (if any) and ORDER BY clause
  query += ` ${whereClause} ORDER BY
        set_name ASC NULLS LAST,
        NULLIF(regexp_replace(card_number, '[^0-9]', '', 'g'), '')::int ASC NULLS LAST,
        card_number ASC NULLS LAST;
  `;


  try {
    // Execute the potentially modified query with parameters
    const result = await db.query(query, queryParams);

    // Send the fetched rows back as a JSON response
    res.status(200).json({
      status: 'success',
      count: result.rows.length,
      cards: result.rows, // This list is now filtered if searchTerm was provided
      // Optionally include the search term in the response for context
      // searchTerm: searchTerm
    });
  } catch (err) {
    console.error('Error fetching cards for API:', err);
    // Pass error to the global error handler in server.js
    // For APIs, sending JSON error might be preferred
    res.status(500).json({ status: 'error', message: 'Error fetching card data.' });
    // next(err); // Alternative: use global error handler
  }
};


/**
 * Fetches cards from the database, optionally filtering by name based on search query,
 * and renders the browse page view.
 * Passes card data and search term to the EJS template.
 * (This function remains unchanged from the previous version)
 */
exports.renderBrowsePage = async (req, res, next) => {
  const searchTerm = req.query.search || '';
  const queryParams = [];
  let whereClause = '';

  let query = `
      SELECT * FROM cards
  `;

  if (searchTerm) {
    whereClause = `WHERE card_name ILIKE $1`;
    queryParams.push(`%${searchTerm}%`);
  }

  query += ` ${whereClause} ORDER BY
        set_name ASC NULLS LAST,
        NULLIF(regexp_replace(card_number, '[^0-9]', '', 'g'), '')::int ASC NULLS LAST,
        card_number ASC NULLS LAST;
  `;

  try {
    const result = await db.query(query, queryParams);

    res.render('browse', {
      title: 'Browse Cards',
      cards: result.rows,
      searchTerm: searchTerm
    });

  } catch (err) {
    console.error('Error fetching cards for browse page:', err);
    next(err);
  }
};

// TODO: Add other functions later (e.g., getCardById)
