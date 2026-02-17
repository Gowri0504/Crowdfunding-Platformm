import Comment from '../models/Comment.js';
import Campaign from '../models/Campaign.js';
import mongoose from 'mongoose';
import { sendSuccessResponse, sendErrorResponse, asyncHandler } from '../middleware/error.js';

// @desc    Get campaign comments
// @route   GET /api/comments/campaign/:campaignId
// @access  Public
export const getComments = asyncHandler(async (req, res) => {
  const { campaignId } = req.params;
  
  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(campaignId)) {
    return sendErrorResponse(res, 'Invalid campaign ID', 400);
  }
  const { page = 1, limit = 10, sort = 'createdAt' } = req.query;
  const skip = (page - 1) * limit;

  const comments = await Comment.find({
    campaign: campaignId,
    status: 'approved'
  })
    .populate('author', 'name avatar')
    .populate('replies.author', 'name avatar')
    .sort({ [sort]: -1 })
    .skip(skip)
    .limit(Number(limit));

  const total = await Comment.countDocuments({
    campaign: campaignId,
    status: 'approved'
  });
  const totalPages = Math.ceil(total / limit);

  sendSuccessResponse(res, {
    comments,
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

// @desc    Create comment
// @route   POST /api/comments
// @access  Private
export const createComment = asyncHandler(async (req, res) => {
  const { campaignId, content, parentId } = req.body;

  // Validate input
  if (!campaignId || !content) {
    return sendErrorResponse(res, 'Campaign ID and content are required', 400);
  }

  // Check if campaign exists
  const campaign = await Campaign.findById(campaignId);
  if (!campaign) {
    return sendErrorResponse(res, 'Campaign not found', 404);
  }

  let comment;

  if (parentId) {
    // This is a reply to an existing comment
    const parentComment = await Comment.findById(parentId);
    if (!parentComment) {
      return sendErrorResponse(res, 'Parent comment not found', 404);
    }

    parentComment.replies.push({
      author: req.user._id,
      content,
      createdAt: new Date()
    });
    await parentComment.save();
    await parentComment.populate('replies.author', 'name avatar');

    comment = parentComment;
  } else {
    // This is a new top-level comment
    comment = await Comment.create({
      campaign: campaignId,
      author: req.user._id,
      content,
      status: 'approved' // Auto-approve for now, can add moderation later
    });

    await comment.populate('author', 'name avatar');
  }

  // Emit real-time update
  const io = req.app.get('io');
  if (io) {
    io.to(`campaign-${campaignId}`).emit('new-comment', {
      comment: parentId ? comment : comment,
      isReply: !!parentId
    });
  }

  sendSuccessResponse(res, { comment }, 'Comment created successfully', 201);
});

// @desc    Update comment
// @route   PUT /api/comments/:id
// @access  Private
export const updateComment = asyncHandler(async (req, res) => {
  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return sendErrorResponse(res, 'Invalid comment ID', 400);
  }

  const { content } = req.body;
  const comment = await Comment.findById(req.params.id);

  if (!comment) {
    return sendErrorResponse(res, 'Comment not found', 404);
  }

  // Check if user is the author
  if (comment.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return sendErrorResponse(res, 'Not authorized to update this comment', 403);
  }

  comment.content = content;
  comment.isEdited = true;
  comment.editedAt = new Date();
  await comment.save();

  await comment.populate('author', 'name avatar');

  sendSuccessResponse(res, { comment }, 'Comment updated successfully');
});

// @desc    Delete comment
// @route   DELETE /api/comments/:id
// @access  Private
export const deleteComment = asyncHandler(async (req, res) => {
  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return sendErrorResponse(res, 'Invalid comment ID', 400);
  }

  const comment = await Comment.findById(req.params.id);

  if (!comment) {
    return sendErrorResponse(res, 'Comment not found', 404);
  }

  // Check if user is the author or admin
  if (comment.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return sendErrorResponse(res, 'Not authorized to delete this comment', 403);
  }

  await comment.deleteOne();

  sendSuccessResponse(res, null, 'Comment deleted successfully');
});

// @desc    Like comment
// @route   POST /api/comments/:id/like
// @access  Private
export const likeComment = asyncHandler(async (req, res) => {
  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return sendErrorResponse(res, 'Invalid comment ID', 400);
  }

  const comment = await Comment.findById(req.params.id);

  if (!comment) {
    return sendErrorResponse(res, 'Comment not found', 404);
  }

  const userId = req.user._id;
  const likeIndex = comment.likes.indexOf(userId);

  if (likeIndex > -1) {
    // User already liked, remove like
    comment.likes.splice(likeIndex, 1);
  } else {
    // Add like
    comment.likes.push(userId);
    // Remove from dislikes if present
    const dislikeIndex = comment.dislikes.indexOf(userId);
    if (dislikeIndex > -1) {
      comment.dislikes.splice(dislikeIndex, 1);
    }
  }

  await comment.save();

  sendSuccessResponse(res, {
    likes: comment.likes.length,
    dislikes: comment.dislikes.length,
    userLiked: comment.likes.includes(userId),
    userDisliked: comment.dislikes.includes(userId)
  }, 'Comment like updated');
});

// @desc    Unlike comment
// @route   DELETE /api/comments/:id/like
// @access  Private
export const unlikeComment = asyncHandler(async (req, res) => {
  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return sendErrorResponse(res, 'Invalid comment ID', 400);
  }

  const comment = await Comment.findById(req.params.id);

  if (!comment) {
    return sendErrorResponse(res, 'Comment not found', 404);
  }

  const userId = req.user._id;
  const likeIndex = comment.likes.indexOf(userId);

  if (likeIndex > -1) {
    comment.likes.splice(likeIndex, 1);
    await comment.save();
  }

  sendSuccessResponse(res, {
    likes: comment.likes.length,
    dislikes: comment.dislikes.length,
    userLiked: comment.likes.includes(userId),
    userDisliked: comment.dislikes.includes(userId)
  }, 'Comment like removed');
});

// @desc    Flag comment
// @route   POST /api/comments/:id/flag
// @access  Private
export const flagComment = asyncHandler(async (req, res) => {
  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return sendErrorResponse(res, 'Invalid comment ID', 400);
  }

  const { reason } = req.body;
  const comment = await Comment.findById(req.params.id);

  if (!comment) {
    return sendErrorResponse(res, 'Comment not found', 404);
  }

  // Check if user already flagged this comment
  const existingFlag = comment.flags.find(flag => flag.user.toString() === req.user._id.toString());
  if (existingFlag) {
    return sendErrorResponse(res, 'You have already flagged this comment', 400);
  }

  comment.flags.push({
    user: req.user._id,
    reason: reason || 'inappropriate',
    createdAt: new Date()
  });

  // Auto-hide comment if it gets too many flags
  if (comment.flags.length >= 5) {
    comment.status = 'hidden';
  }

  await comment.save();

  sendSuccessResponse(res, null, 'Comment flagged successfully');
});