const express = require('express');
const paymentController = require('../controllers/paymentController');

const router = express.Router();

// Retrieve Razorpay key
router.get('/razorpay-key', paymentController.getRazorpayKey);

// Subscribe to a plan
router.post('/subscribe', paymentController.subscribe);

// Unsubscribe from a plan
router.post('/unsubscribe/:subscriptionId', paymentController.unsubscribe);

// Verify a payment
router.post('/verify', paymentController.verify);

// Get all payments
router.get('/payments', paymentController.getAllPayments);

module.exports = router;
