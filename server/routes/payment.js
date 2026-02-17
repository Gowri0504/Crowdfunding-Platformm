

import express from 'express';
import {
  createCashfreeOrder,
  handleCashfreeWebhook,
  processRefund,
  createStripePaymentIntent,
  handleStripeWebhook,
  createRazorpayOrder,
  verifyRazorpayPayment
} from '../controllers/payment.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/stripe/create-intent', protect, createStripePaymentIntent);
router.post('/stripe/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);

router.post('/cashfree/create-order', protect, createCashfreeOrder);
router.post('/cashfree/webhook', handleCashfreeWebhook);

router.post('/razorpay/create-order', protect, createRazorpayOrder);
router.post('/razorpay/verify', protect, verifyRazorpayPayment);

router.post('/refund', protect, processRefund);

export default router;
