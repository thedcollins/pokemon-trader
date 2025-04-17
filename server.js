// server.js

// Load environment variables from .env file first
require('dotenv').config();

// --- Require Modules ---
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');

// --- Require Middleware ---
const { checkAuthStatus } = require('./middleware/authMiddleware');

// --- Require Routes ---
const authRoutes = require('./routes/authRoutes');
const cardApiRoutes = require('./routes/cardApiRoutes');
const cardPageRoutes = require('./routes/cardPageRoutes');
const collectionRoutes = require('./routes/collectionRoutes');
const tradeListRoutes = require('./routes/tradeListRoutes');
const wantListRoutes = require('./routes/wantListRoutes'); // << ADDED: Require Want List routes

// --- Create Express App ---
const app = express();
const PORT = process.env.PORT || 3000;

// --- Core Middleware Setup ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// --- Apply Custom Middleware ---
app.use(checkAuthStatus); // Sets res.locals.user and res.locals.isLoggedIn

// --- Routes ---

// Basic Home Route
app.get('/', (req, res) => {
    res.render('index', { title: 'Pocket Trader Home' });
});

// Mount Authentication Routes
app.use('/auth', authRoutes);

// Mount Card API Routes
app.use('/api', cardApiRoutes);

// Mount Card Page Routes
app.use('/cards', cardPageRoutes);

// Mount Collection Routes
app.use('/collection', collectionRoutes);

// Mount Trade List Routes
app.use('/tradelist', tradeListRoutes);

// Mount Want List Routes
app.use('/wantlist', wantListRoutes); // << ADDED: Mount Want List routes under /wantlist

// --- Error Handling ---

// Catch 404
app.use((req, res, next) => {
  const error = new Error('Not Found');
  error.status = 404;
  next(error);
});

// General error handler
app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = process.env.NODE_ENV === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error', { title: `Error ${err.status || 500}`});
});


// --- Start Server ---
app.listen(PORT, () => {
    console.log(`Server is running successfully on http://localhost:${PORT}`);
    try {
        require('./config/db');
        console.log("Database config loaded.");
    } catch (err) {
        console.error("Error loading database config:", err.message);
    }
});

