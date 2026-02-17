// server/routes/user.js
import express from 'express';
import { getUserStats, updateProfile, getProfile, deleteProfile, getAllUsers } from '../controllers/userController.js';
import { getPublicProfile, updatePreferences, updateSocialLinks, getUserActivity } from '../controllers/profileController.js';
import { uploadAvatar, deleteAvatar } from '../controllers/avatarController.js';
import { protect } from '../middleware/auth.js';
import { uploadAvatar as uploadAvatarMiddleware } from '../middleware/upload.js';

const router = express.Router();

// @route   GET /api/users/stats
// @desc    Get user statistics
// @access  Private
router.get('/stats', protect, getUserStats);

// @route   POST /api/users/avatar
// @desc    Upload user avatar
// @access  Private
router.post('/avatar', protect, uploadAvatarMiddleware, uploadAvatar);

// @route   DELETE /api/users/avatar
// @desc    Delete user avatar
// @access  Private
router.delete('/avatar', protect, deleteAvatar);

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', protect, getProfile);

// @route   PATCH /api/users/profile
// @desc    Update user profile
// @access  Private
router.patch('/profile', protect, updateProfile);

// @route   DELETE /api/users/profile
// @desc    Delete user profile
// @access  Private
router.delete('/profile', protect, deleteProfile);

// @route   GET /api/users/all
// @desc    Get all users (admin only)
// @access  Private
router.get('/all', protect, getAllUsers);

// Profile-specific routes
// @route   GET /api/users/:userId/public
// @desc    Get public user profile
// @access  Public
router.get('/:userId/public', getPublicProfile);

// @route   PATCH /api/users/preferences
// @desc    Update user preferences
// @access  Private
router.patch('/preferences', protect, updatePreferences);

// @route   PATCH /api/users/social-links
// @desc    Update user social links
// @access  Private
router.patch('/social-links', protect, updateSocialLinks);

// @route   GET /api/users/activity
// @desc    Get user activity feed
// @access  Private
router.get('/activity', protect, getUserActivity);

export default router;