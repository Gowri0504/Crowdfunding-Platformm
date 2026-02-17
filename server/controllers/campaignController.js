import Campaign from '../models/Campaign.js';
import Donation from '../models/Donation.js';
import Comment from '../models/Comment.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { sendSuccessResponse, sendErrorResponse, asyncHandler } from '../middleware/error.js';
import { deleteFromCloudinary } from '../middleware/upload.js';
import { generateCampaignQR } from '../utils/qrGenerator.js';
import { sendCampaignCreationConfirmation, sendCampaignImprovementEmail, sendCampaignUpdateEmail } from '../utils/emailService.js';
import mongoose from 'mongoose';

// @desc    Add update to campaign
// @route   POST /api/campaigns/:id/updates
// @access  Private (Creator only)
// Function moved to line ~520

// @desc    Create new campaign
// @route   POST /api/campaigns
// @access  Private (Creator/Admin)
export const createCampaign = asyncHandler(async (req, res) => {
  try {
    const {
      title,
      category,
      subcategory,
      description,
      shortDescription,
      targetAmount,
      currency,
      upiId,
      deadline,
      story,
      tags,
      location,
      faqs,
      rewards,
      settings
    } = req.body;

    // Parse JSON strings if they're provided as strings
    let parsedFaqs = [];
    let parsedRewards = [];
    let parsedSettings = {};
    let parsedTags = [];

    try {
      parsedFaqs = faqs ? (typeof faqs === 'string' ? JSON.parse(faqs) : faqs) : [];
      parsedRewards = rewards ? (typeof rewards === 'string' ? JSON.parse(rewards) : rewards) : [];
      parsedSettings = settings ? (typeof settings === 'string' ? JSON.parse(settings) : settings) : {};
      parsedTags = tags ? (typeof tags === 'string' ? tags.split(',').map(tag => tag.trim()) : tags) : [];
    } catch (parseError) {
      return sendErrorResponse(res, 'Invalid JSON format in faqs, rewards, or settings', 400);
    }

    // Create campaign with pending status for admin review
    const campaign = await Campaign.create({
      creator: req.user._id,
      title,
      category,
      subcategory,
      description,
      shortDescription,
      targetAmount,
      currency,
      upiId,
      deadline,
      story,
      tags: parsedTags,
      location,
      faqs: parsedFaqs,
      rewards: parsedRewards,
      settings: parsedSettings,
      status: 'pending', // Campaigns require admin approval
      paymentDetails: {
        upiId: upiId
      }
    });

    // Generate QR code for the campaign
    const qrResult = await generateCampaignQR({
      campaignId: campaign._id.toString(),
      title: campaign.title,
      targetAmount: campaign.targetAmount,
      upiId: campaign.upiId || upiId,
      currency: campaign.currency
    });

    if (qrResult.success) {
      // Update campaign with QR code data
      campaign.qrCode = {
        data: qrResult.data.qrData,
        imageUrl: qrResult.data.qrCodeImage,
        paymentUrl: qrResult.data.paymentUrl,
        generatedAt: qrResult.data.generatedAt
      };
      
      // Store UPI QR code if available
      if (qrResult.data.upiQrCodeImage) {
        campaign.paymentDetails.upiQrCode = qrResult.data.upiQrCodeImage;
      }
      
      await campaign.save();
    }

    // Populate creator information for email
    await campaign.populate('creator', 'name email');

    // Send campaign creation confirmation email
    try {
      await sendCampaignCreationConfirmation(campaign);
    } catch (emailError) {
      console.error('Failed to send campaign creation email:', emailError);
      // Don't fail the campaign creation if email fails
    }

    // Update user stats
    req.user.stats.campaignsCreated += 1;
    await req.user.save();

    sendSuccessResponse(res, { 
      campaign,
      qrCode: qrResult.success ? {
        paymentUrl: qrResult.data.paymentUrl,
        qrCodeImage: qrResult.data.qrCodeImage,
        upiQrCodeImage: qrResult.data.upiQrCodeImage
      } : null
    }, 'Campaign created successfully with QR code and submitted for review');
  } catch (error) {
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return sendErrorResponse(res, validationErrors.join(', '), 400);
    }
    
    // Handle other errors
    console.error('Campaign creation error:', error);
    sendErrorResponse(res, 'Failed to create campaign', 500);
  }
});

// @desc    Get all campaigns with filters
// @route   GET /api/campaigns
// @access  Public
export const getCampaigns = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 12,
    category,
    status = 'active',
    search,
    sort = 'createdAt',
    order = 'desc',
    minAmount,
    maxAmount,
    location,
    tags
  } = req.query;

  // Build filter object
  const filter = { status };
  
  if (category) filter.category = category;
  if (location) filter['location.city'] = new RegExp(location, 'i');
  if (tags) {
    const tagArray = tags.split(',').map(tag => tag.trim());
    filter.tags = { $in: tagArray };
  }
  if (minAmount || maxAmount) {
    filter.targetAmount = {};
    if (minAmount) filter.targetAmount.$gte = Number(minAmount);
    if (maxAmount) filter.targetAmount.$lte = Number(maxAmount);
  }

  // Build search query
  if (search) {
    filter.$text = { $search: search };
  }

  // Build sort object
  const sortObj = {};
  sortObj[sort] = order === 'desc' ? -1 : 1;

  const skip = (page - 1) * limit;

  // Get campaigns
  const campaigns = await Campaign.find(filter)
    .populate('creator', 'name avatar isVerified')
    .sort(sortObj)
    .skip(skip)
    .limit(Number(limit));

  // Get total count
  const total = await Campaign.countDocuments(filter);

  // Calculate pagination
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  sendSuccessResponse(res, {
    campaigns,
    pagination: {
      currentPage: Number(page),
      totalPages,
      total,
      hasNextPage,
      hasPrevPage,
      limit: Number(limit)
    }
  });
});

// @desc    Get single campaign
// @route   GET /api/campaigns/:id
// @access  Public
export const getCampaign = asyncHandler(async (req, res) => {
  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return sendErrorResponse(res, 'Invalid campaign ID', 400);
  }

  const campaign = await Campaign.findById(req.params.id)
    .populate('creator', 'name avatar bio isVerified socialLinks')
    .populate('moderation.reviewedBy', 'name');

  if (!campaign) {
    return sendErrorResponse(res, 'Campaign not found', 404);
  }

  // Increment view count
  await campaign.incrementViews();

  // Get donation statistics
  const donationStats = await Donation.aggregate([
    { $match: { campaign: campaign._id, paymentStatus: 'completed' } },
    { $group: {
      _id: null,
      totalDonations: { $sum: 1 },
      totalAmount: { $sum: '$amount' },
      averageDonation: { $avg: '$amount' },
      largestDonation: { $max: '$amount' }
    }}
  ]);

  // Get recent donations
  const recentDonations = await Donation.find({
    campaign: campaign._id,
    paymentStatus: 'completed'
  })
  .populate('donor', 'name avatar isAnonymous')
  .sort({ createdAt: -1 })
  .limit(10);

  // Get comments count
  const commentsCount = await Comment.countDocuments({
    campaign: campaign._id,
    isDeleted: false,
    'moderation.isHidden': false
  });

  sendSuccessResponse(res, {
    campaign,
    stats: donationStats[0] || {
      totalDonations: 0,
      totalAmount: 0,
      averageDonation: 0,
      largestDonation: 0
    },
    recentDonations,
    commentsCount
  });
});

// @desc    Update campaign
// @route   PUT /api/campaigns/:id
// @access  Private (Creator/Admin)
export const updateCampaign = asyncHandler(async (req, res) => {
  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return sendErrorResponse(res, 'Invalid campaign ID', 400);
  }

  const campaign = await Campaign.findById(req.params.id);

  if (!campaign) {
    return sendErrorResponse(res, 'Campaign not found', 404);
  }

  // Check ownership
  if (campaign.creator.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return sendErrorResponse(res, 'Not authorized to update this campaign', 403);
  }

  // Check if campaign can be updated
  if (campaign.status === 'completed' || campaign.status === 'cancelled') {
    return sendErrorResponse(res, 'Cannot update completed or cancelled campaign', 400);
  }

  const updateData = { ...req.body };
  
  // Handle tags array
  if (updateData.tags) {
    updateData.tags = updateData.tags.split(',').map(tag => tag.trim());
  }

  // Handle nested objects
  if (updateData.faqs) {
    updateData.faqs = JSON.parse(updateData.faqs);
  }
  if (updateData.rewards) {
    updateData.rewards = JSON.parse(updateData.rewards);
  }
  if (updateData.settings) {
    updateData.settings = JSON.parse(updateData.settings);
  }

  const updatedCampaign = await Campaign.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  ).populate('creator', 'name avatar isVerified');

  sendSuccessResponse(res, { campaign: updatedCampaign }, 'Campaign updated successfully');
});

// @desc    Delete campaign
// @route   DELETE /api/campaigns/:id
// @access  Private (Creator/Admin)
export const deleteCampaign = asyncHandler(async (req, res) => {
  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return sendErrorResponse(res, 'Invalid campaign ID', 400);
  }

  const campaign = await Campaign.findById(req.params.id);

  if (!campaign) {
    return sendErrorResponse(res, 'Campaign not found', 404);
  }

  // Check ownership
  if (campaign.creator.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return sendErrorResponse(res, 'Not authorized to delete this campaign', 403);
  }

  // Check if campaign has donations
  const hasDonations = await Donation.exists({ campaign: campaign._id });
  if (hasDonations) {
    return sendErrorResponse(res, 'Cannot delete campaign with existing donations', 400);
  }

  // Delete associated images from Cloudinary
  if (campaign.images && campaign.images.length > 0) {
    for (const image of campaign.images) {
      if (image.public_id) {
        await deleteFromCloudinary(image.public_id);
      }
    }
  }

  // Delete campaign
  await Campaign.findByIdAndDelete(req.params.id);

  // Update user stats
  req.user.stats.campaignsCreated -= 1;
  await req.user.save();

  sendSuccessResponse(res, null, 'Campaign deleted successfully');
});

// @desc    Upload campaign images
// @route   POST /api/campaigns/:id/images
// @access  Private (Creator/Admin)
export const handleCampaignImageUpload = asyncHandler(async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return sendErrorResponse(res, 'Campaign not found', 404);
    }

    // Check ownership
    if (campaign.creator.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return sendErrorResponse(res, 'Not authorized to update this campaign', 403);
    }

    if (!req.files || req.files.length === 0) {
      return sendErrorResponse(res, 'No images uploaded', 400);
    }

    // Process uploaded images
    const images = req.files.map(file => {
      // Check if using Cloudinary (file.path will be a full URL) or local storage
      const isCloudinaryUrl = file.path && file.path.startsWith('http');
      const imageUrl = isCloudinaryUrl ? file.path : `/uploads/${file.filename}`;
      
      return {
        public_id: file.filename || file.originalname,
        url: imageUrl,
        caption: ''
      };
    });

    // Add images to campaign
    campaign.images = [...campaign.images, ...images];
    await campaign.save();

    sendSuccessResponse(res, { images }, 'Images uploaded successfully');
  } catch (error) {
    console.error('Image upload error:', error);
    sendErrorResponse(res, 'Failed to upload images. Please check your Cloudinary configuration.', 500);
  }
});

// @desc    Delete campaign image
// @route   DELETE /api/campaigns/:id/images/:imageId
// @access  Private (Creator/Admin)
export const deleteCampaignImage = asyncHandler(async (req, res) => {
  const { id, imageId } = req.params;

  const campaign = await Campaign.findById(id);

  if (!campaign) {
    return sendErrorResponse(res, 'Campaign not found', 404);
  }

  // Check ownership
  if (campaign.creator.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return sendErrorResponse(res, 'Not authorized to update this campaign', 403);
  }

  // Find image
  const image = campaign.images.id(imageId);
  if (!image) {
    return sendErrorResponse(res, 'Image not found', 404);
  }

  // Delete from Cloudinary
  if (image.public_id) {
    await deleteFromCloudinary(image.public_id);
  }

  // Remove from campaign
  campaign.images.pull(imageId);
  await campaign.save();

  sendSuccessResponse(res, null, 'Image deleted successfully');
});

// @desc    Add campaign update
// @route   POST /api/campaigns/:id/updates
// @access  Private (Creator/Admin)
export const addCampaignUpdate = asyncHandler(async (req, res) => {
  try {
    const { title, content } = req.body;
    const campaign = await Campaign.findById(req.params.id).populate('creator', 'name email');
    
    if (!campaign) {
      return sendErrorResponse(res, 'Campaign not found', 404);
    }
    
    // Check ownership
    if (campaign.creator._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return sendErrorResponse(res, 'Not authorized to update this campaign', 403);
    }
    
    const updateData = { title, content };
    
    // Handle images if uploaded
    if (req.files && req.files.length > 0) {
      updateData.images = req.files.map(file => ({
        public_id: file.filename,
        url: file.path
      }));
    }
    
    await campaign.addUpdate(updateData);
    
    // Get all donors for this campaign to send improvement notifications
    try {
      const donors = await Donation.find({ 
        campaign: campaign._id, 
        paymentStatus: 'completed' 
      })
      .populate('donor', 'name email')
      .select('donor donorDetails amount createdAt');

      if (donors.length > 0) {
        // Send campaign improvement email to all donors
        const emailResult = await sendCampaignImprovementEmail(campaign, donors, updateData);
      
        if (emailResult.success) {
          console.log(`Campaign improvement emails sent to ${emailResult.stats.successful} donors`);
        } else {
          console.error('Failed to send campaign improvement emails:', emailResult.error);
        }
      }
    } catch (emailError) {
      console.error('Error sending campaign improvement notifications:', emailError);
      // Don't fail the update if email fails
    }

    sendSuccessResponse(res, { 
      update: updateData,
      notificationsSent: true 
    }, 'Campaign update added successfully and donors notified');
  } catch (error) {
    console.error('Error in addCampaignUpdate:', error);
    sendErrorResponse(res, error.message || 'Failed to add campaign update', 500);
  }
});

// @desc    Add campaign FAQ
// @route   POST /api/campaigns/:id/faqs
// @access  Private (Creator/Admin)
export const addCampaignFAQ = asyncHandler(async (req, res) => {
  const { question, answer } = req.body;

  const campaign = await Campaign.findById(req.params.id);

  if (!campaign) {
    return sendErrorResponse(res, 'Campaign not found', 404);
  }

  // Check ownership
  if (campaign.creator.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return sendErrorResponse(res, 'Not authorized to update this campaign', 403);
  }

  await campaign.addFAQ({ question, answer });

  sendSuccessResponse(res, null, 'FAQ added successfully');
});

// @desc    Get trending campaigns
// @route   GET /api/campaigns/trending
// @access  Public
export const getTrendingCampaigns = asyncHandler(async (req, res) => {
  const { limit = 6 } = req.query;

  const campaigns = await Campaign.findTrending(Number(limit))
    .populate('creator', 'name avatar isVerified');

  sendSuccessResponse(res, { campaigns });
});

// @desc    Get campaigns by category
// @route   GET /api/campaigns/category/:category
// @access  Public
export const getCampaignsByCategory = asyncHandler(async (req, res) => {
  const { category } = req.params;
  const { page = 1, limit = 12 } = req.query;

  const skip = (page - 1) * limit;

  const campaigns = await Campaign.findByCategory(category, Number(limit))
    .populate('creator', 'name avatar isVerified')
    .skip(skip);

  const total = await Campaign.countDocuments({
    category,
    status: 'active',
    deadline: { $gt: new Date() }
  });

  const totalPages = Math.ceil(total / limit);

  sendSuccessResponse(res, {
    campaigns,
    pagination: {
      currentPage: Number(page),
      totalPages,
      total,
      category
    }
  });
});

// @desc    Search campaigns
// @route   GET /api/campaigns/search
// @access  Public
export const searchCampaigns = asyncHandler(async (req, res) => {
  const { q, page = 1, limit = 12 } = req.query;

  if (!q) {
    return sendErrorResponse(res, 'Search query is required', 400);
  }

  const skip = (page - 1) * limit;

  const campaigns = await Campaign.find({
    $text: { $search: q },
    status: 'active',
    deadline: { $gt: new Date() }
  })
  .populate('creator', 'name avatar isVerified')
  .sort({ score: { $meta: 'textScore' } })
  .skip(skip)
  .limit(Number(limit));

  const total = await Campaign.countDocuments({
    $text: { $search: q },
    status: 'active',
    deadline: { $gt: new Date() }
  });

  const totalPages = Math.ceil(total / limit);

  sendSuccessResponse(res, {
    campaigns,
    pagination: {
      currentPage: Number(page),
      totalPages,
      total,
      query: q
    }
  });
});

// @desc    Get user campaigns
// @route   GET /api/campaigns/user/:userId or GET /api/campaigns/user
// @access  Public for specific user, Private for current user
export const getUserCampaigns = asyncHandler(async (req, res) => {
  let userId;
  
  // If userId is in params, use it, otherwise use the authenticated user's ID
  if (req.params.userId) {
    userId = req.params.userId;
  } else if (req.user) {
    // For the /api/campaigns/user route (no userId param)
    userId = req.user._id;
  } else {
    return sendErrorResponse(res, 'User ID is required', 400);
  }

  const { page = 1, limit = 12 } = req.query;
  const skip = (page - 1) * limit;

  const campaigns = await Campaign.find({
    creator: userId,
    status: { $in: ['pending', 'active', 'completed', 'cancelled', 'rejected'] }
  })
  .populate('creator', 'name avatar isVerified')
  .populate('moderation.reviewedBy', 'name')
  .sort({ createdAt: -1 })
  .skip(skip)
  .limit(Number(limit));

  const total = await Campaign.countDocuments({
    creator: userId,
    status: { $in: ['pending', 'active', 'completed', 'cancelled', 'rejected'] }
  });

  const totalPages = Math.ceil(total / limit);

  sendSuccessResponse(res, {
    campaigns,
    pagination: {
      currentPage: Number(page),
      totalPages,
      total
    }
  });
});

// @desc    Get campaign analytics
// @route   GET /api/campaigns/:id/analytics
// @access  Private (Creator/Admin)
export const getCampaignAnalytics = asyncHandler(async (req, res) => {
  const campaign = await Campaign.findById(req.params.id);

  if (!campaign) {
    return sendErrorResponse(res, 'Campaign not found', 404);
  }

  // Check ownership
  if (campaign.creator.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return sendErrorResponse(res, 'Not authorized to view analytics', 403);
  }

  // Get donation analytics
  const donationAnalytics = await Donation.aggregate([
    { $match: { campaign: campaign._id, paymentStatus: 'completed' } },
    { $group: {
      _id: {
        $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
      },
      count: { $sum: 1 },
      amount: { $sum: '$amount' }
    }},
    { $sort: { _id: 1 } }
  ]);

  // Get donor demographics
  const donorDemographics = await Donation.aggregate([
    { $match: { campaign: campaign._id, paymentStatus: 'completed' } },
    { $lookup: {
      from: 'users',
      localField: 'donor',
      foreignField: '_id',
      as: 'donorInfo'
    }},
    { $unwind: '$donorInfo' },
    { $group: {
      _id: '$donorInfo.location.country',
      count: { $sum: 1 },
      totalAmount: { $sum: '$amount' }
    }},
    { $sort: { count: -1 } }
  ]);

  // Get payment method distribution
  const paymentMethods = await Donation.aggregate([
    { $match: { campaign: campaign._id, paymentStatus: 'completed' } },
    { $group: {
      _id: '$paymentMethod',
      count: { $sum: 1 },
      totalAmount: { $sum: '$amount' }
    }},
    { $sort: { count: -1 } }
  ]);

  sendSuccessResponse(res, {
    campaign,
    analytics: {
      donationAnalytics,
      donorDemographics,
      paymentMethods
    }
  });
});