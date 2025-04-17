// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

/**
 * Middleware to check for a valid JWT in cookies and make user info available to views.
 * This middleware does NOT block requests if the user is not logged in.
 * It simply checks the token and sets res.locals.user if authentication is successful.
 */
const checkAuthStatus = (req, res, next) => {
  const token = req.cookies.token; // Assumes cookie name is 'token'

  // Assume user is not logged in initially
  res.locals.user = null;
  res.locals.isLoggedIn = false;

  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, (err, decodedPayload) => {
      if (err) {
        console.log('Auth Status Check: Invalid token found.', err.message);
        res.clearCookie('token'); // Clear invalid token
      } else {
        console.log('Auth Status Check: Valid token found for user:', decodedPayload.username);
        // Make user info available to all views via res.locals
        res.locals.user = {
          id: decodedPayload.userId,
          username: decodedPayload.username
        };
        res.locals.isLoggedIn = true;
      }
      next(); // Always proceed
    });
  } else {
    // No token found, proceed
    next();
  }
};

/**
 * Middleware to protect routes that require authentication.
 * Checks for a valid JWT in cookies. If valid, attaches user info to req.user and proceeds.
 * If invalid or missing, redirects to the login page.
 */
const protectRoute = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    // No token found, redirect to login
    // Optional: could add a query parameter to redirect back after login
    // return res.redirect('/auth/login?redirect=' + req.originalUrl);
    return res.redirect('/auth/login');
  }

  // Verify the token
  jwt.verify(token, process.env.JWT_SECRET, (err, decodedPayload) => {
    if (err) {
      // Token is invalid (e.g., expired, tampered)
      console.log('Protected Route: Invalid token.', err.message);
      res.clearCookie('token'); // Clear the invalid token
      return res.redirect('/auth/login');
    } else {
      // Token is valid!
      // Attach user payload to the request object for use in subsequent handlers
      req.user = {
        id: decodedPayload.userId,
        username: decodedPayload.username
        // Add other fields from payload if needed by controllers
      };
      console.log(`Protected Route Access Granted: User ${req.user.username} (ID: ${req.user.id})`);
      next(); // Proceed to the actual route handler
    }
  });
};


// Export both middleware functions
module.exports = {
  checkAuthStatus,
  protectRoute
};
