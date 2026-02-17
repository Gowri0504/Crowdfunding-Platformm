// server/controllers/profileController.js
import User from '../models/User.js';
import Campaign from '../models/Campaign.js';
import Donation from '../models/Donation.js';
import { sendSuccessResponse, sendErrorResponse, asyncHandler } from '../middleware/error.js';
import mongoose from 'mongoose';

// @desc    Get user profile with detailed stats
// @route   GET /api/profile/:userId
// @access  Public
export const getPublicProfile = asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return sendErrorResponse(res, 'Invalid user ID', 400);
    }
    
    const user = await User.findById(userId)
      .select('-password -loginAttempts -lockUntil -emailVerified -preferences')
      .populate('referredBy', 'name avatar');
    
    if (!user) {
      return sendErrorResponse(res, 'User not found', 404);
    }
    
    // Get user's campaigns
    const campaigns = await Campaign.find({ creator: userId })
      .select('title description targetAmount currentAmount status images category createdAt')
      .sort({ createdAt: -1 })
      .limit(6);
    
    // Get user's donations (only if user is viewing their own profile)
    let donations = [];
    if (req.user && req.user._id.toString() === userId) {
      donations = await Donation.find({ donor: userId })
        .populate('campaign', 'title images')
        .select('amount createdAt campaign')
        .sort({ createdAt: -1 })
        .limit(10);
    }
    
    // Calculate additional stats
    const totalCampaigns = await Campaign.countDocuments({ creator: userId });
    const activeCampaigns = await Campaign.countDocuments({ creator: userId, status: 'active' });
    const completedCampaigns = await Campaign.countDocuments({ creator: userId, status: 'completed' });
    
    const profileData = {
      user: {
        ...user.toObject(),
        stats: {
          ...user.stats,
          totalCampaigns,
          activeCampaigns,
          completedCampaigns
        }
      },
      campaigns,
      donations: req.user && req.user._id.toString() === userId ? donations : []
    };
    
    sendSuccessResponse(res, profileData);
  } catch (error) {
    console.error('Error getting public profile:', error);
    sendErrorResponse(res, 'Failed to get profile', 500);
  }
});

// @desc    Update user preferences
// @route   PATCH /api/profile/preferences
// @access  Private
export const updatePreferences = asyncHandler(async (req, res) => {
  try { 
    const userId = req.user._id;
    const { emailNotifications, pushNotifications, newsletter } = req.body;
    
    const user = await User.findById(userId);
    
    if (!user) {
      return sendErrorResponse(res, 'User not found', 404);
    }
    
    // Update preferences
    if (emailNotifications !== undefined) user.preferences.emailNotifications = emailNotifications;
    if (pushNotifications !== undefined) user.preferences.pushNotifications = pushNotifications;
    if (newsletter !== undefined) user.preferences.newsletter = newsletter;
    
    await user.save();
    
    sendSuccessResponse(res, { preferences: user.preferences }, 'Preferences updated successfully');
  } catch (error) {
    console.error('Error updating preferences:', error);
    sendErrorResponse(res, 'Failed to update preferences', 500);
  }
});

// @desc    Update social links
// @route   PATCH /api/profile/social-links
// @access  Private
export const updateSocialLinks = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    const { website, facebook, twitter, instagram, linkedin } = req.body;
    
    const user = await User.findById(userId);
    
    if (!user) {
      return sendErrorResponse(res, 'User not found', 404);
    }
    
    // Validate URLs if provided
    const urlRegex = /^https?:\/\/.+/;
    const socialLinks = {};
    
    if (website) {
      if (!urlRegex.test(website)) {
        return sendErrorResponse(res, 'Website must be a valid URL starting with http:// or https://', 400);
      }
      socialLinks.website = website;
    }
    
    if (facebook) socialLinks.facebook = facebook;
    if (twitter) socialLinks.twitter = twitter;
    if (instagram) socialLinks.instagram = instagram;
    if (linkedin) socialLinks.linkedin = linkedin;
    
    // Update social links
    user.socialLinks = { ...user.socialLinks, ...socialLinks };
    
    await user.save();
    
    sendSuccessResponse(res, { socialLinks: user.socialLinks }, 'Social links updated successfully');
  } catch (error) {
    console.error('Error updating social links:', error);
    sendErrorResponse(res, 'Failed to update social links', 500);
  }
});

// @desc    Get user activity feed
// @route   GET /api/profile/activity
// @access  Private
export const getUserActivity = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    // Get recent donations
    const donations = await Donation.find({ donor: userId })
      .populate('campaign', 'title images')
      .select('amount createdAt campaign')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    // Get recent campaigns
    const campaigns = await Campaign.find({ creator: userId })
      .select('title status createdAt updatedAt')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit);
    
    // Combine and sort activities
    const activities = [
      ...donations.map(donation => ({
        type: 'donation',
        data: donation,
        date: donation.createdAt
      })),
      ...campaigns.map(campaign => ({
        type: 'campaign',
        data: campaign,
        date: campaign.updatedAt
      }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, limit);
    
    const total = await Donation.countDocuments({ donor: userId }) + 
                  await Campaign.countDocuments({ creator: userId });
    
    sendSuccessResponse(res, {
      activities,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error getting user activity:', error);
    sendErrorResponse(res, 'Failed to get user activity', 500);
  }
});