import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  campaign: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: [true, 'Comment content is required'],
    maxlength: [1000, 'Comment cannot be more than 1000 characters']
  },
  parentComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  },
  replies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  dislikes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: Date,
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date,
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  moderation: {
    isFlagged: {
      type: Boolean,
      default: false
    },
    flaggedBy: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      reason: String,
      flaggedAt: Date
    }],
    isHidden: {
      type: Boolean,
      default: false
    },
    hiddenBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    hiddenAt: Date,
    hiddenReason: String
  },
  metadata: {
    userAgent: String,
    ipAddress: String
  }
}, {
  timestamps: true
});

// Indexes for performance
commentSchema.index({ campaign: 1, createdAt: -1 });
commentSchema.index({ author: 1, createdAt: -1 });
commentSchema.index({ parentComment: 1 });
commentSchema.index({ 'moderation.isFlagged': 1 });

// Virtual for like count
commentSchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

// Virtual for dislike count
commentSchema.virtual('dislikeCount').get(function() {
  return this.dislikes.length;
});

// Virtual for reply count
commentSchema.virtual('replyCount').get(function() {
  return this.replies.length;
});

// Instance method to toggle like
commentSchema.methods.toggleLike = function(userId) {
  const likeIndex = this.likes.indexOf(userId);
  const dislikeIndex = this.dislikes.indexOf(userId);
  
  if (likeIndex > -1) {
    this.likes.splice(likeIndex, 1);
  } else {
    this.likes.push(userId);
    if (dislikeIndex > -1) {
      this.dislikes.splice(dislikeIndex, 1);
    }
  }
  
  return this.save();
};

// Instance method to toggle dislike
commentSchema.methods.toggleDislike = function(userId) {
  const dislikeIndex = this.dislikes.indexOf(userId);
  const likeIndex = this.likes.indexOf(userId);
  
  if (dislikeIndex > -1) {
    this.dislikes.splice(dislikeIndex, 1);
  } else {
    this.dislikes.push(userId);
    if (likeIndex > -1) {
      this.likes.splice(likeIndex, 1);
    }
  }
  
  return this.save();
};

// Instance method to add reply
commentSchema.methods.addReply = function(replyId) {
  this.replies.push(replyId);
  return this.save();
};

// Instance method to flag comment
commentSchema.methods.flagComment = function(userId, reason) {
  this.moderation.isFlagged = true;
  this.moderation.flaggedBy.push({
    user: userId,
    reason,
    flaggedAt: new Date()
  });
  
  return this.save();
};

// Instance method to hide comment
commentSchema.methods.hideComment = function(userId, reason) {
  this.moderation.isHidden = true;
  this.moderation.hiddenBy = userId;
  this.moderation.hiddenAt = new Date();
  this.moderation.hiddenReason = reason;
  
  return this.save();
};

// Instance method to soft delete
commentSchema.methods.softDelete = function(userId) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = userId;
  
  return this.save();
};

// Static method to get comments for a campaign
commentSchema.statics.getCampaignComments = function(campaignId, page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  
  return this.find({
    campaign: campaignId,
    parentComment: null,
    isDeleted: false,
    'moderation.isHidden': false
  })
  .populate('author', 'name avatar isVerified')
  .populate({
    path: 'replies',
    match: { isDeleted: false, 'moderation.isHidden': false },
    populate: { path: 'author', select: 'name avatar isVerified' }
  })
  .sort({ createdAt: -1 })
  .skip(skip)
  .limit(limit);
};

// Static method to get flagged comments
commentSchema.statics.getFlaggedComments = function() {
  return this.find({
    'moderation.isFlagged': true,
    'moderation.isHidden': false
  })
  .populate('author', 'name email')
  .populate('campaign', 'title')
  .sort({ 'moderation.flaggedBy.flaggedAt': -1 });
};

export default mongoose.model('Comment', commentSchema); 