import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: [
      'campaign_created',
      'campaign_approved',
      'campaign_rejected',
      'donation_received',
      'donation_completed',
      'campaign_goal_reached',
      'campaign_ending_soon',
      'campaign_ended',
      'comment_received',
      'comment_replied',
      'reward_claimed',
      'verification_approved',
      'verification_rejected',
      'campaign_update',
      'welcome',
      'milestone_reached',
      'trending_campaign',
      'admin_message'
    ]
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  data: {
    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campaign'
    },
    donation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Donation'
    },
    comment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment'
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    amount: Number,
    url: String,
    extra: mongoose.Schema.Types.Mixed
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  seen: {
    type: Boolean,
    default: false
  },
  seenAt: {
    type: Date
  },

  isPushSent: {
    type: Boolean,
    default: false
  },
  pushSentAt: Date,
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  expiresAt: Date,
  metadata: {
    userAgent: String,
    ipAddress: String
  }
}, {
  timestamps: true
});

// Indexes for performance
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ type: 1, createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Pre-save middleware to set expiration for certain types
notificationSchema.pre('save', function(next) {
  if (!this.expiresAt) {
    // Set expiration based on notification type
    const now = new Date();
    switch (this.type) {
      case 'campaign_ending_soon':
        this.expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
        break;
      case 'trending_campaign':
        this.expiresAt = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days
        break;
      case 'milestone_reached':
        this.expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
        break;
      default:
        this.expiresAt = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 days
    }
  }
  next();
});

// Instance method to mark as read
notificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

// Instance method to mark push as sent
notificationSchema.methods.markPushSent = function() {
  this.isPushSent = true;
  this.pushSentAt = new Date();
  return this.save();
};

// Static method to get unread notifications count
notificationSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({
    recipient: userId,
    isRead: false
  });
};

// Static method to get notifications for user
notificationSchema.statics.getUserNotifications = function(userId, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  
  return this.find({
    recipient: userId
  })
  .populate('data.campaign', 'title slug images')
  .populate('data.donation', 'amount transactionId')
  .populate('data.comment', 'content')
  .populate('data.user', 'name avatar')
  .sort({ createdAt: -1 })
  .skip(skip)
  .limit(limit);
};

// Static method to mark all notifications as read
notificationSchema.statics.markAllAsRead = function(userId) {
  return this.updateMany(
    { recipient: userId, isRead: false },
    { isRead: true, readAt: new Date() }
  );
};

// Static method to create notification
notificationSchema.statics.createNotification = function(data) {
  const notification = new this(data);
  return notification.save();
};

// Static method to create bulk notifications
notificationSchema.statics.createBulkNotifications = function(notifications) {
  return this.insertMany(notifications);
};

// Static method to get notifications for push sending
notificationSchema.statics.getUnsentPushNotifications = function() {
  return this.find({
    isPushSent: false,
    expiresAt: { $gt: new Date() }
  })
  .populate('recipient', 'name preferences')
  .populate('data.campaign', 'title slug')
  .sort({ createdAt: 1 })
  .limit(100);
};

export default mongoose.model('Notification', notificationSchema);