import express from 'express';
import {
  createCampaign,
  getCampaigns,
  getCampaign,
  updateCampaign,
  deleteCampaign,
  handleCampaignImageUpload,
  deleteCampaignImage,
  addCampaignUpdate,
  addCampaignFAQ,
  getTrendingCampaigns,
  getCampaignsByCategory,
  searchCampaigns,
  getUserCampaigns,
  getCampaignAnalytics
} from '../controllers/campaignController.js';
import { protect, authorize, requireCreatorRole } from '../middleware/auth.js';
import { uploadCampaignImages, uploadDocuments } from '../middleware/upload.js';
import { body } from 'express-validator';

const router = express.Router();

// Validation middleware
const validateCampaign = [
  body('title')
    .trim()
    .isLength({ min: 10, max: 100 })
    .withMessage('Title must be between 10 and 100 characters'),
  body('category')
    .isIn(['medical', 'education', 'emergency', 'creative', 'technology', 'environment', 'community', 'animals', 'sports', 'other'])
    .withMessage('Please select a valid category'),
  body('description')
    .trim()
    .isLength({ min: 50, max: 2000 })
    .withMessage('Description must be between 50 and 2000 characters'),
  body('shortDescription')
    .trim()
    .isLength({ min: 20, max: 200 })
    .withMessage('Short description must be between 20 and 200 characters'),
  body('targetAmount')
    .isFloat({ min: 1 })
    .withMessage('Target amount must be at least 1'),
  body('deadline')
    .isISO8601()
    .custom((value) => {
      const deadline = new Date(value);
      const now = new Date();
      const minDeadline = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
      if (deadline <= now) {
        throw new Error('Deadline must be in the future');
      }
      if (deadline < minDeadline) {
        throw new Error('Deadline must be at least 7 days from now');
      }
      return true;
    })
    .withMessage('Deadline must be at least 7 days from now'),
  body('story')
    .trim()
    .isLength({ min: 100, max: 5000 })
    .withMessage('Story must be between 100 and 5000 characters'),
  body('currency')
    .optional()
    .isIn(['INR', 'USD', 'EUR', 'GBP'])
    .withMessage('Please select a valid currency')
];

const validateCampaignUpdate = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 10, max: 100 })
    .withMessage('Title must be between 10 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 50, max: 2000 })
    .withMessage('Description must be between 50 and 2000 characters'),
  body('shortDescription')
    .optional()
    .trim()
    .isLength({ min: 20, max: 200 })
    .withMessage('Short description must be between 20 and 200 characters'),
  body('targetAmount')
    .optional()
    .isFloat({ min: 1 })
    .withMessage('Target amount must be at least 1'),
  body('deadline')
    .optional()
    .isISO8601()
    .custom((value) => {
      const deadline = new Date(value);
      const now = new Date();
      if (deadline <= now) {
        throw new Error('Deadline must be in the future');
      }
      return true;
    })
    .withMessage('Deadline must be in the future'),
  body('story')
    .optional()
    .trim()
    .isLength({ min: 100, max: 5000 })
    .withMessage('Story must be between 100 and 5000 characters')
];

const validateUpdate = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('Update title must be between 5 and 100 characters'),
  body('content')
    .trim()
    .isLength({ min: 20, max: 2000 })
    .withMessage('Update content must be between 20 and 2000 characters')
];

const validateFAQ = [
  body('question')
    .trim()
    .isLength({ min: 10, max: 200 })
    .withMessage('Question must be between 10 and 200 characters'),
  body('answer')
    .trim()
    .isLength({ min: 20, max: 1000 })
    .withMessage('Answer must be between 20 and 1000 characters')
];

// Public routes
router.get('/', getCampaigns);
router.get('/trending', getTrendingCampaigns);
router.get('/search', searchCampaigns);
router.get('/category/:category', getCampaignsByCategory);
router.get('/user/:userId', getUserCampaigns);
router.get('/user', protect, getUserCampaigns); // Added route for current user's campaigns
router.get('/:id', getCampaign);

// Protected routes
router.post('/', protect, requireCreatorRole, validateCampaign, createCampaign);
router.put('/:id', protect, requireCreatorRole, validateCampaignUpdate, updateCampaign);
router.delete('/:id', protect, requireCreatorRole, deleteCampaign);

// Campaign update route
router.post('/:id/updates', protect, addCampaignUpdate);

// Image upload routes
router.post('/:id/images', protect, requireCreatorRole, uploadCampaignImages, handleCampaignImageUpload);
router.delete('/:id/images/:imageId', protect, requireCreatorRole, deleteCampaignImage);

// Campaign updates and FAQs
router.post('/:id/updates', protect, requireCreatorRole, validateUpdate, addCampaignUpdate);
router.post('/:id/faqs', protect, requireCreatorRole, validateFAQ, addCampaignFAQ);

// Analytics (Creator/Admin only)
router.get('/:id/analytics', protect, requireCreatorRole, getCampaignAnalytics);

export default router;