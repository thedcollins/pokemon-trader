// server.js

// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const path = require('path'); // Node.js module for working with file paths

// Import database query function (assuming config/db.js exists)
// const db = require('./config/db'); // We might use this later

// Import route handlers (we will create these later)
const authRoutes = require('./routes/authRoutes');
// const cardRoutes = require('./routes/cardRoutes');
// const collectionRoutes = require('./routes/collectionRoutes');
// ... other routes

const app = express();
const PORT = process.env.PORT || 3000;

// --- Middleware Setup ---
app.use(express.json()); // Allows server to accept JSON data in request body
app.use(express.urlencoded({ extended: true })); // Allows server to accept standard form data

// --- View Engine Setup ---
app.set('view engine', 'ejs'); // Set EJS as the templating engine
app.set('views', path.join(__dirname, 'views')); // Tell Express where to find .ejs files

// --- Static Files Setup ---
// Serve files from the 'public' directory (CSS, client-side JS, images)
app.use(express.static(path.join(__dirname, 'public')));

// --- Routes ---

// Basic Home Route
app.get('/', (req, res) => {
    // Render the index.ejs file from the views folder
    res.render('index', { title: 'Pocket Trader Home' }); // Assumes views/index.ejs exists
});

// Mount Authentication Routes
// All routes defined in authRoutes will be prefixed with /auth
app.use('/auth', authRoutes);

// TODO: Mount other routers later
// app.use('/cards', cardRoutes);
// app.use('/collection', collectionRoutes);
// ... other routes

// --- Error Handling (Basic Example - Add more specific handlers later) ---
// Catch 404 and forward to error handler (if no routes matched)
app.use((req, res, next) => {
  const error = new Error('Not Found');
  error.status = 404;
  next(error); // Pass the error to the next middleware
});

// General error handler (catches errors passed by next(error))
app.use((err, req, res, next) => {
  // Set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = process.env.NODE_ENV === 'development' ? err : {};

  // Render the error page
  res.status(err.status || 500);
  res.render('error', { title: `Error ${err.status || 500}`}); // Assumes views/error.ejs exists
});


// --- Start Server ---
app.listen(PORT, () => {
    console.log(`Server is running successfully on http://localhost:${PORT}`);
    // Verify DB connection is loaded (optional check)
    try {
        require('./config/db'); // This just checks if the module loads without crashing
        console.log("Database config loaded.");
    } catch (err) {
        console.error("Error loading database config:", err.message);
    }
});

