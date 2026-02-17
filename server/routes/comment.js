import express from 'express';
import {
  getComments,
  createComment,
  updateComment,
  deleteComment,
  likeComment,
  unlikeComment,
  flagComment
} from '../controllers/commentController.js';
import { protect } from '../middleware/auth.js';
import { body } from 'express-validator';

const router = express.Router();

// Validation middleware
const validateComment = [
  body('campaignId')
    .isMongoId()
    .withMessage('Valid campaign ID is required'),
  body('content')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Content must be between 1 and 1000 characters'),
  body('parentId')
    .optional()
    .isMongoId()
    .withMessage('Valid parent comment ID is required')
];

const validateCommentUpdate = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Content must be between 1 and 1000 characters')
];

const validateFlag = [
  body('reason')
    .optional()
    .isIn(['spam', 'inappropriate', 'harassment', 'misinformation', 'other'])
    .withMessage('Invalid flag reason')
];

// Routes
router.get('/campaign/:campaignId', getComments);
router.post('/', protect, validateComment, createComment);
router.put('/:id', protect, validateCommentUpdate, updateComment);
router.delete('/:id', protect, deleteComment);
router.post('/:id/like', protect, likeComment);
router.delete('/:id/like', protect, unlikeComment);
router.post('/:id/flag', protect, validateFlag, flagComment);

export default router;