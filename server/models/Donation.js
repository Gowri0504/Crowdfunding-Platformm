import mongoose from 'mongoose';

const donationSchema = new mongoose.Schema({
  campaign: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    required: true
  },
  donor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: [true, 'Please provide donation amount'],
    min: [1, 'Donation amount must be at least 1']
  },
  currency: {
    type: String,
    default: 'INR',
    enum: ['INR', 'USD', 'EUR', 'GBP']
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['cashfree', 'upi', 'netbanking', 'card', 'wallet']
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  transactionId: {
    type: String,
    unique: true
  },
  gatewayTransactionId: String,
  isAnonymous: {
    type: Boolean,
    default: false
  },
  message: {
    type: String,
    maxlength: [500, 'Message cannot be more than 500 characters']
  },
  reward: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reward'
  },
  recurring: {
    isRecurring: {
      type: Boolean,
      default: false
    },
    frequency: {
      type: String,
      enum: ['monthly', 'quarterly', 'yearly']
    },
    nextPaymentDate: Date,
    endDate: Date,
    totalPayments: {
      type: Number,
      default: 0
    }
  },
  taxReceipt: {
    generated: {
      type: Boolean,
      default: false
    },
    receiptNumber: String,
    downloadUrl: String,
    generatedAt: Date
  },
  refund: {
    requested: {
      type: Boolean,
      default: false
    },
    processed: {
      type: Boolean,
      default: false
    },
    amount: Number,
    reason: String,
    processedAt: Date,
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  metadata: {
    userAgent: String,
    ipAddress: String,
    referrer: String,
    utmSource: String,
    utmMedium: String,
    utmCampaign: String
  },
  donorDetails: {
    name: String,
    email: String,
    phone: String,
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      zipCode: String
    }
  },
  paymentDetails: {
    qrCodeUsed: {
      type: Boolean,
      default: false
    },
    paymentUrl: String,
    upiTransactionId: String,
    bankReference: String
  },
  notificationStatus: {
    donorNotified: {
      type: Boolean,
      default: false
    },
    campaignOwnerNotified: {
      type: Boolean,
      default: false
    },
    receiptSent: {
      type: Boolean,
      default: false
    }
  },
  fees: {
    platformFee: {
      type: Number,
      default: 0
    },
    paymentGatewayFee: {
      type: Number,
      default: 0
    },
    netAmount: {
      type: Number,
      required: true
    }
  }
}, {
  timestamps: true
});

// Indexes for performance
donationSchema.index({ campaign: 1, createdAt: -1 });
donationSchema.index({ donor: 1, createdAt: -1 });
donationSchema.index({ paymentStatus: 1 });
donationSchema.index({ transactionId: 1 });
donationSchema.index({ 'recurring.isRecurring': 1, 'recurring.nextPaymentDate': 1 });

// Pre-save middleware to generate transaction ID
donationSchema.pre('save', function(next) {
  if (!this.transactionId) {
    this.transactionId = 'DON' + Date.now() + Math.random().toString(36).substring(2, 8).toUpperCase();
  }
  next();
});

// Instance method to calculate fees
donationSchema.methods.calculateFees = function() {
  // Platform fee: 5% of donation amount
  this.fees.platformFee = Math.round(this.amount * 0.05);
  
  // Payment gateway fee: 2% + ₹3 for Cashfree (standard for all payment methods)
  this.fees.paymentGatewayFee = Math.round(this.amount * 0.02) + 3;
  
  this.fees.netAmount = this.amount - this.fees.platformFee - this.fees.paymentGatewayFee;
  
  return this;
};

// Instance method to mark as refunded
donationSchema.methods.markRefunded = function(reason, processedBy) {
  this.paymentStatus = 'refunded';
  this.refund.requested = true;
  this.refund.processed = true;
  this.refund.amount = this.amount;
  this.refund.reason = reason;
  this.refund.processedAt = new Date();
  this.refund.processedBy = processedBy;
  
  return this.save();
};

// Static method to get total donations for a campaign
donationSchema.statics.getCampaignTotal = function(campaignId) {
  return this.aggregate([
    { $match: { campaign: mongoose.Types.ObjectId(campaignId), paymentStatus: 'completed' } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
};

// Static method to get donor statistics
donationSchema.statics.getDonorStats = function(donorId) {
  return this.aggregate([
    { $match: { donor: mongoose.Types.ObjectId(donorId), paymentStatus: 'completed' } },
    { $group: { 
      _id: null, 
      totalDonated: { $sum: '$amount' },
      totalDonations: { $sum: 1 },
      averageDonation: { $avg: '$amount' },
      largestDonation: { $max: '$amount' }
    }}
  ]);
};

// Static method to find recurring donations
donationSchema.statics.findRecurringDonations = function() {
  return this.find({
    'recurring.isRecurring': true,
    'recurring.nextPaymentDate': { $lte: new Date() },
    paymentStatus: 'completed'
  }).populate('donor campaign');
};

export default mongoose.model('Donation', donationSchema);