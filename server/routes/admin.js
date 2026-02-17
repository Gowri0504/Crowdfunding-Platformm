import express from 'express';
import {
  getPendingCampaigns,
  getAllCampaignsForAdmin,
  approveCampaign,
  rejectCampaign,
  deleteCampaign,
  getAllUsers,
  updateUserRole,
  toggleUserStatus,
  getAnalytics,
  generateFinancialReport
} from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/auth.js';
import { body } from 'express-validator';

const router = express.Router();

// Validation middleware for campaign review
const validateCampaignReview = [
  body('reviewNotes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Review notes must not exceed 500 characters')
];

const validateCampaignRejection = [
  body('reviewNotes')
    .notEmpty()
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Review notes are required and must be between 10-500 characters')
];

// All admin routes require authentication and admin role
router.use(protect);
router.use(authorize('admin'));

// Campaign management routes
router.get('/campaigns/pending', getPendingCampaigns);
router.get('/campaigns', getAllCampaignsForAdmin);
router.put('/campaigns/:id/approve', validateCampaignReview, approveCampaign);
router.put('/campaigns/:id/reject', validateCampaignRejection, rejectCampaign);
router.delete('/campaigns/:id', deleteCampaign);

// User management routes
router.get('/users', getAllUsers);
router.put('/users/:id/role', updateUserRole);
router.put('/users/:id/status', toggleUserStatus);

// Analytics route
router.get('/analytics', getAnalytics);

// Financial reports route
router.get('/reports/financial', generateFinancialReport);

export default router;