// config/db.js
// Import the Pool class from the 'pg' library (Node.js PostgreSQL client)
const { Pool } = require('pg');

// Load environment variables from the .env file
// This ensures DATABASE_URL is available in process.env
require('dotenv').config();

// Create a new Pool instance.
// The Pool manages multiple client connections automatically.
// It reads connection details directly from environment variables
// if they follow the standard names (PGUSER, PGPASSWORD, PGHOST, PGPORT, PGDATABASE)
// OR it uses the DATABASE_URL environment variable if present.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Add SSL configuration below if connecting to a DB that requires it (like some cloud providers)
  // ssl: {
  //   rejectUnauthorized: false // Be cautious with this in production
  // }
});

// Optional: Add an event listener to check for connection errors on idle clients
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
  process.exit(-1); // Exit the process if a connection pool error occurs
});

// Export an object with a 'query' method.
// This allows other parts of your application (like models or controllers)
// to execute queries using the connection pool without managing connections directly.
module.exports = {
  /**
   * Executes a SQL query using a client from the connection pool.
   * @param {string} text - The SQL query string (can contain placeholders like $1, $2).
   * @param {Array} [params] - An optional array of parameters to safely substitute into the query text.
   * @returns {Promise<QueryResult>} A promise that resolves with the query result.
   */
  query: (text, params) => pool.query(text, params),

  // Optional: You could add a function to get a client for transactions later
  // getClient: () => pool.connect(),
};

// Optional: Log successful pool creation (helps during startup)
console.log('Database connection pool configured successfully.');

