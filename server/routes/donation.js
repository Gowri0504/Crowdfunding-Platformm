import express from 'express';
import {
  createDonation,
  getDonation,
  getUserDonations,
  getCampaignDonations,
  requestRefund,
  getReceipt,
  updateDonationStatus
} from '../controllers/donationController.js';
import { protect } from '../middleware/auth.js';
import { body } from 'express-validator';

const router = express.Router();

// Validation middleware
const validateDonation = [
  body('campaignId')
    .isMongoId()
    .withMessage('Valid campaign ID is required'),
  body('amount')
    .isFloat({ min: 1 })
    .withMessage('Amount must be at least 1'),
  body('message')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Message cannot exceed 500 characters'),
  body('paymentMethod')
    .optional()
    .isIn(['card', 'upi', 'netbanking', 'wallet'])
    .withMessage('Invalid payment method')
];

const validateRefund = [
  body('reason')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Reason must be between 10 and 500 characters')
];

// Routes
router.post('/', protect, validateDonation, createDonation);
router.get('/user', protect, getUserDonations);
router.get('/campaign/:campaignId', getCampaignDonations);
router.get('/:id', protect, getDonation);
router.patch('/:id/status', protect, updateDonationStatus);
router.post('/:id/refund', protect, validateRefund, requestRefund);
router.get('/:id/receipt', protect, getReceipt);

export default router;