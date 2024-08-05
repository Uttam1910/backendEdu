const roleMiddleware = (requiredRole) => {
    return (req, res, next) => {
      if (req.user.role !== requiredRole) {
        return res.status(403).json({ error: 'Access forbidden: Only students can enroll and view the courses.' });
      }
      next();
    };
  };
  
  module.exports = roleMiddleware;
  