// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/multer');
// const { protect } = require('../middleware/authMiddleware');
// const { updateProfile } = require('../controllers/userController');

// Register a new user
router.post('/register', userController.register);

// Login a user
router.post('/login', userController.login);

// Logout a user
router.post('/logout', authMiddleware, userController.logout);

// View profile of the logged-in user
router.get('/profile', authMiddleware, userController.viewProfile);

// Upload user avatar
router.put('/profile/avatar', authMiddleware, upload.uploadAvatar.single('avatar'), userController.uploadAvatar);


// Forgot Password
router.post('/forgotpassword', userController.forgotPassword);

// Reset Password
router.put('/resetpassword/:token', userController.resetPassword);

// Update profile
router.put('/profile', authMiddleware, userController.updateProfile);

// Change password
router.put('/changepassword', authMiddleware, userController.changePassword);


module.exports = router;
