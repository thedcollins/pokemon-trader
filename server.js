// server.js

// Load environment variables from .env file first
require('dotenv').config();

// --- Require Modules ---
const express = require('express');
const path = require('path'); // Node.js module for working with file paths
const cookieParser = require('cookie-parser'); // << ADDED: Middleware to parse cookies

// --- Require Middleware ---
const { checkAuthStatus } = require('./middleware/authMiddleware'); // << ADDED: Our custom middleware

// --- Require Routes ---
const authRoutes = require('./routes/authRoutes');
// TODO: Add other route requires later
// const cardRoutes = require('./routes/cardRoutes');
// const collectionRoutes = require('./routes/collectionRoutes');

// --- Create Express App ---
const app = express();
const PORT = process.env.PORT || 3000;

// --- Core Middleware Setup ---
app.use(express.json()); // Allows server to accept JSON data in request body
app.use(express.urlencoded({ extended: true })); // Allows server to accept standard form data
app.use(cookieParser()); // << ADDED: Use cookie-parser middleware to access req.cookies

// --- View Engine Setup ---
app.set('view engine', 'ejs'); // Set EJS as the templating engine
app.set('views', path.join(__dirname, 'views')); // Tell Express where to find .ejs files

// --- Static Files Setup ---
// Serve files from the 'public' directory (CSS, client-side JS, images)
app.use(express.static(path.join(__dirname, 'public')));

// --- Apply Custom Middleware ---
// Check authentication status on ALL requests and set res.locals for views
app.use(checkAuthStatus); // << ADDED: Use our custom middleware *after* cookie parser

// --- Routes ---

// Basic Home Route
app.get('/', (req, res) => {
    // Render the index.ejs file from the views folder
    // The 'user' and 'isLoggedIn' variables are now available from res.locals
    // due to the checkAuthStatus middleware running before this handler
    res.render('index', {
        title: 'Pocket Trader Home'
        // No need to explicitly pass user/isLoggedIn here, they are in res.locals
    });
});

// Mount Authentication Routes
// All routes defined in authRoutes will be prefixed with /auth
app.use('/auth', authRoutes);

// TODO: Mount other routers later
// app.use('/cards', cardRoutes);
// app.use('/collection', collectionRoutes);
// ... other routes

// --- Error Handling ---

// Catch 404 and forward to error handler (if no routes matched above)
app.use((req, res, next) => {
  const error = new Error('Not Found');
  error.status = 404;
  next(error); // Pass the error to the next middleware
});

// General error handler (catches errors passed by next(error))
app.use((err, req, res, next) => {
  // Set locals, only providing error details in development
  res.locals.message = err.message;
  // Ensure error object exists before trying to access stack
  res.locals.error = process.env.NODE_ENV === 'development' ? err : {};

  // Render the error page
  res.status(err.status || 500);
  // Pass title separately for the error page template
  res.render('error', { title: `Error ${err.status || 500}`}); // Assumes views/error.ejs exists
});


// --- Start Server ---
app.listen(PORT, () => {
    console.log(`Server is running successfully on http://localhost:${PORT}`);
    // Verify DB connection module loads (optional check)
    try {
        require('./config/db'); // This just checks if the module loads without crashing
        console.log("Database config loaded.");
    } catch (err) {
        console.error("Error loading database config:", err.message);
    }
});

