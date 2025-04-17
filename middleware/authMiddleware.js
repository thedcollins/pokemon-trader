// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

/**
 * Middleware to check for a valid JWT in cookies and make user info available to views.
 * This middleware does NOT block requests if the user is not logged in.
 * It simply checks the token and sets res.locals.user if authentication is successful.
 */
const checkAuthStatus = (req, res, next) => {
  // Get the token from the cookies sent by the browser
  const token = req.cookies.token; // Assumes you named the cookie 'token' during login

  // Assume user is not logged in initially
  res.locals.user = null;
  res.locals.isLoggedIn = false;

  if (token) {
    // If a token exists, try to verify it
    jwt.verify(token, process.env.JWT_SECRET, (err, decodedPayload) => {
      if (err) {
        // Token is invalid or expired
        console.log('Auth Status Check: Invalid token found.', err.message);
        // Clear the invalid cookie just in case
        res.clearCookie('token');
      } else {
        // Token is valid, make payload available to views via res.locals
        console.log('Auth Status Check: Valid token found for user:', decodedPayload.username);
        // IMPORTANT: Only attach non-sensitive data you need in views
        res.locals.user = {
          id: decodedPayload.userId,
          username: decodedPayload.username
          // Add other fields from payload if needed
        };
        res.locals.isLoggedIn = true;
      }
      // Proceed to the next middleware/route handler regardless of token validity
      next();
    });
  } else {
    // No token found, proceed without setting user info
    next();
  }
};

// We might add other auth middleware here later, like one to PROTECT routes

module.exports = {
  checkAuthStatus
  // protectRoute // Example for later
};
