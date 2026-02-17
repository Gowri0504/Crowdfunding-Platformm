// server/controllers/avatarController.js
import User from '../models/User.js';
import { sendSuccessResponse, sendErrorResponse, asyncHandler } from '../middleware/error.js';
import { deleteFromCloudinary } from '../middleware/upload.js';

// @desc    Upload user avatar
// @route   POST /api/users/avatar
// @access  Private
export const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    return sendErrorResponse(res, 'No file uploaded', 400);
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    return sendErrorResponse(res, 'User not found', 404);
  }

  // Delete old avatar from Cloudinary if it exists
  if (user.avatar && user.avatar.public_id) {
    try {
      await deleteFromCloudinary(user.avatar.public_id);
    } catch (error) {
      console.error('Error deleting old avatar:', error);
      // Continue with the update even if deletion fails
    }
  }

  // Update user avatar with new Cloudinary info
  user.avatar = {
    public_id: req.file.filename,
    url: req.file.path
  };

  await user.save();

  sendSuccessResponse(res, { avatar: user.avatar }, 'Avatar uploaded successfully');
});

// @desc    Delete user avatar
// @route   DELETE /api/users/avatar
// @access  Private
export const deleteAvatar = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    return sendErrorResponse(res, 'User not found', 404);
  }

  // Delete avatar from Cloudinary if it exists
  if (user.avatar && user.avatar.public_id) {
    try {
      await deleteFromCloudinary(user.avatar.public_id);
    } catch (error) {
      console.error('Error deleting avatar:', error);
      // Continue with the update even if deletion fails
    }
  }

  // Set default avatar
  user.avatar = {
    public_id: '',
    url: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg'
  };

  await user.save();

  sendSuccessResponse(res, null, 'Avatar deleted successfully');
});