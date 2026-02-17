import Notification from '../models/Notification.js';
import mongoose from 'mongoose';
import { sendSuccessResponse, sendErrorResponse, asyncHandler } from '../middleware/error.js';

// @desc    Mark notifications as seen (not read)
// @route   PUT /api/notifications/mark-seen
// @access  Private
export const markNotificationsAsSeen = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { recipient: req.user._id, seen: false },
    { seen: true, seenAt: new Date() }
  );

  sendSuccessResponse(res, null, 'All notifications marked as seen');
});

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
export const getNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, type, read } = req.query;
  const skip = (page - 1) * limit;

  const query = { recipient: req.user._id };
  
  if (type) {
    query.type = type;
  }
  
  if (read !== undefined) {
    query.isRead = read === 'true';
  }

  const notifications = await Notification.find(query)
    .populate('sender', 'name avatar')
    .populate('campaign', 'title')
    .populate('data.campaign', 'title slug images')
    .populate('data.donation', 'amount transactionId')
    .populate('data.comment', 'content')
    .populate('data.user', 'name avatar')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  const total = await Notification.countDocuments(query);
  const totalPages = Math.ceil(total / limit);

  sendSuccessResponse(res, {
    notifications,
    pagination: {
      currentPage: Number(page),
      totalPages,
      total,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      limit: Number(limit)
    }
  });
});

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
export const markAsRead = asyncHandler(async (req, res) => {
  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return sendErrorResponse(res, 'Invalid notification ID', 400);
  }

  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    return sendErrorResponse(res, 'Notification not found', 404);
  }

  // Check if user is the recipient
  if (notification.recipient.toString() !== req.user._id.toString()) {
    return sendErrorResponse(res, 'Not authorized to update this notification', 403);
  }

  notification.isRead = true;
  notification.readAt = new Date();
  await notification.save();

  sendSuccessResponse(res, { notification }, 'Notification marked as read');
});

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
export const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { recipient: req.user._id, isRead: false },
    { isRead: true, readAt: new Date() }
  );

  sendSuccessResponse(res, null, 'All notifications marked as read');
});

// @desc    Get unread count
// @route   GET /api/notifications/unread-count
// @access  Private
export const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({
    recipient: req.user._id,
    isRead: false
  });

  sendSuccessResponse(res, { count });
});

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
export const deleteNotification = asyncHandler(async (req, res) => {
  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return sendErrorResponse(res, 'Invalid notification ID', 400);
  }

  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    return sendErrorResponse(res, 'Notification not found', 404);
  }

  // Check if user is the recipient
  if (notification.recipient.toString() !== req.user._id.toString()) {
    return sendErrorResponse(res, 'Not authorized to delete this notification', 403);
  }

  await notification.deleteOne();

  sendSuccessResponse(res, null, 'Notification deleted successfully');
});

// Helper function to create notification
export const createNotification = async (data) => {
  try {
    const notification = await Notification.create(data);
    
    // Populate notification data for real-time delivery
    const populatedNotification = await Notification.findById(notification._id)
      .populate('data.campaign', 'title slug images')
      .populate('data.donation', 'amount transactionId')
      .populate('data.comment', 'content')
      .populate('data.user', 'name avatar');
    
    // Emit real-time notification
    const io = global.io;
    if (io) {
      io.to(`user-${data.recipient}`).emit('new-notification', populatedNotification);
    }
    
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return { error: error.message };
  }
};