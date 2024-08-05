

// middleware/authenticateUser.js
const jwt = require('jsonwebtoken');
const User = require('../models/user');

const authMiddleware = async (req, res, next) => {
  let token;

  // Check if token is provided in the Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Extract the token from the header
      token = req.headers.authorization.split(' ')[1];
      
      // Verify the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Find the user by ID and exclude the password
      req.user = await User.findById(decoded.id).select('-password');
      
      // Proceed to the next middleware or route handler
      next();
    } catch (error) {
      console.error('Error while verifying token:', error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  // If no token is provided, respond with an error
  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

module.exports = authMiddleware;
