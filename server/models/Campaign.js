import mongoose from 'mongoose';
import slugify from 'slugify';

const campaignSchema = new mongoose.Schema({
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Please provide a campaign title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  category: {
    type: String,
    required: [true, 'Please select a category'],
    enum: [
      'medical', 'education', 'emergency', 'creative', 'technology', 
      'environment', 'community', 'animals', 'sports', 'other'
    ]
  },
  subcategory: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please provide a campaign description'],
    minlength: [50, 'Description must be at least 50 characters']
  },
  shortDescription: {
    type: String,
    required: [true, 'Please provide a short description'],
    maxlength: [200, 'Short description cannot be more than 200 characters']
  },
  targetAmount: {
    type: Number,
    required: [true, 'Please set a target amount'],
    min: [1, 'Target amount must be at least 1']
  },
  currency: {
    type: String,
    default: 'INR',
    enum: ['INR', 'USD', 'EUR', 'GBP']
  },
  upiId: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        // Basic UPI ID validation - can be enhanced as needed
        return !v || /^[\w.-]+@[\w.-]+$/.test(v);
      },
      message: props => `${props.value} is not a valid UPI ID!`
    }
  },
  paymentDetails: {
    upiId: {
      type: String,
      trim: true
    },
    bankAccount: {
      accountNumber: String,
      ifscCode: String,
      accountHolderName: String,
      bankName: String
    },
    paypalEmail: String,
    cryptoWallet: {
      address: String,
      type: {
        type: String,
        enum: ['bitcoin', 'ethereum', 'other']
      }
    }
  },
  qrCode: {
    data: String, // QR code data string
    imageUrl: String, // Base64 or URL to QR code image
    paymentUrl: String, // Direct payment URL
    generatedAt: {
      type: Date,
      default: Date.now
    }
  },
  currentAmount: {
    type: Number,
    default: 0
  },
  deadline: {
    type: Date,
    required: [true, 'Please set a campaign deadline']
  },
  status: {
    type: String,
    enum: ['draft', 'pending', 'active', 'paused', 'completed', 'cancelled', 'rejected'],
    default: 'draft'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationBadge: {
    type: Boolean,
    default: false
  },
  featured: {
    type: Boolean,
    default: false
  },
  trending: {
    type: Boolean,
    default: false
  },
  images: [{
    public_id: String,
    url: String,
    caption: String
  }],
  video: {
    public_id: String,
    url: String,
    type: {
      type: String,
      enum: ['youtube', 'vimeo', 'upload']
    }
  },
  story: {
    type: String,
    required: [true, 'Please provide your story']
  },
  tags: [{
    type: String,
    trim: true
  }],
  location: {
    country: String,
    state: String,
    city: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  updates: [{
    title: {
      type: String,
      required: true
    },
    content: {
      type: String,
      required: true
    },
    images: [{
      public_id: String,
      url: String
    }],
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  faqs: [{
    question: {
      type: String,
      required: true
    },
    answer: {
      type: String,
      required: true
    }
  }],
  rewards: [{
    title: {
      type: String,
      required: true
    },
    description: String,
    amount: {
      type: Number,
      required: true
    },
    quantity: {
      type: Number,
      default: -1 // -1 means unlimited
    },
    claimed: {
      type: Number,
      default: 0
    },
    deliveryDate: Date,
    image: {
      public_id: String,
      url: String
    }
  }],
  analytics: {
    views: {
      type: Number,
      default: 0
    },
    uniqueViews: {
      type: Number,
      default: 0
    },
    shares: {
      type: Number,
      default: 0
    },
    bookmarks: {
      type: Number,
      default: 0
    },
    conversionRate: {
      type: Number,
      default: 0
    }
  },
  socialProof: {
    donorCount: {
      type: Number,
      default: 0
    },
    averageDonation: {
      type: Number,
      default: 0
    },
    largestDonation: {
      type: Number,
      default: 0
    }
  },
  settings: {
    allowAnonymousDonations: {
      type: Boolean,
      default: true
    },
    showDonorList: {
      type: Boolean,
      default: true
    },
    allowComments: {
      type: Boolean,
      default: true
    },
    autoExtend: {
      type: Boolean,
      default: false
    },
    extendDays: {
      type: Number,
      default: 30
    }
  },
  documents: {
    businessPlan: {
      public_id: String,
      url: String
    },
    financialProjections: {
      public_id: String,
      url: String
    },
    legalDocuments: [{
      public_id: String,
      url: String,
      name: String
    }]
  },
  seo: {
    metaTitle: String,
    metaDescription: String,
    keywords: [String]
  },
  moderation: {
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedAt: Date,
    reviewNotes: String,
    rejectionReason: String
  }
}, {
  timestamps: true
});

// Indexes for search and performance
campaignSchema.index({ title: 'text', description: 'text', story: 'text', tags: 'text' });
campaignSchema.index({ status: 1, deadline: 1 });
campaignSchema.index({ category: 1, status: 1 });
campaignSchema.index({ creator: 1, status: 1 });
campaignSchema.index({ featured: 1, status: 1 });
campaignSchema.index({ trending: 1, status: 1 });

// Generate slug from title before saving
campaignSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('title')) {
    // Create base slug from title
    let baseSlug = slugify(this.title, {
      lower: true,
      strict: true,
      remove: /[*+~.(),'"\!:@]/g
    });
    
    // Check if slug already exists
    let slug = baseSlug;
    let counter = 1;
    let slugExists = true;
    
    while (slugExists) {
      const existingCampaign = await mongoose.model('Campaign').findOne({ slug });
      if (!existingCampaign || existingCampaign._id.equals(this._id)) {
        slugExists = false;
      } else {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
    }
    
    this.slug = slug;
  }
  next();
});

// Virtual for progress percentage
campaignSchema.virtual('progressPercentage').get(function() {
  return Math.min((this.currentAmount / this.targetAmount) * 100, 100);
});

// Virtual for days remaining
campaignSchema.virtual('daysRemaining').get(function() {
  const now = new Date();
  const deadline = new Date(this.deadline);
  const diffTime = deadline - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
});

// Virtual for isExpired
campaignSchema.virtual('isExpired').get(function() {
  return new Date() > new Date(this.deadline);
});

// Instance method to update analytics
campaignSchema.methods.incrementViews = function() {
  this.analytics.views += 1;
  return this.save();
};

// Instance method to add update
campaignSchema.methods.addUpdate = function(updateData) {
  this.updates.push(updateData);
  return this.save();
};

// Instance method to add FAQ
campaignSchema.methods.addFAQ = function(faqData) {
  this.faqs.push(faqData);
  return this.save();
};

// Static method to find active campaigns
campaignSchema.statics.findActive = function() {
  return this.find({
    status: 'active',
    deadline: { $gt: new Date() }
  });
};

// Static method to find trending campaigns
campaignSchema.statics.findTrending = function(limit = 10) {
  return this.find({
    status: 'active',
    trending: true,
    deadline: { $gt: new Date() }
  })
  .sort({ 'analytics.views': -1 })
  .limit(limit);
};

// Static method to find campaigns by category
campaignSchema.statics.findByCategory = function(category, limit = 20) {
  return this.find({
    category,
    status: 'active',
    deadline: { $gt: new Date() }
  })
  .sort({ createdAt: -1 })
  .limit(limit);
};

// Pre-save hook to generate slug from title
campaignSchema.pre('save', function(next) {
  if (!this.slug || this.isModified('title')) {
    this.slug = slugify(this.title, {
      lower: true,
      strict: true,
      remove: /[*+~.(),'"!:@]/g
    });
    
    // Add a random suffix to ensure uniqueness
    if (this.isNew) {
      this.slug = `${this.slug}-${Math.random().toString(36).substring(2, 8)}`;
    }
  }
  next();
});

export default mongoose.model('Campaign', campaignSchema);
