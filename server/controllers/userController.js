// server/controllers/userController.js
import User from '../models/User.js';
import Campaign from '../models/Campaign.js';
import Donation from '../models/Donation.js';
import { sendSuccessResponse, sendErrorResponse, asyncHandler } from '../middleware/error.js';

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
export const getProfile = asyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    if (!user) {
      return sendErrorResponse(res, 'User not found', 404);
    }
    
    sendSuccessResponse(res, { user });
  } catch (error) {
    sendErrorResponse(res, 'Failed to get profile', 500);
  }
});

// @desc    Delete user profile
// @route   DELETE /api/users/profile
// @access  Private
export const deleteProfile = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Check if user has active campaigns
    const activeCampaigns = await Campaign.find({ 
      creator: userId, 
      status: { $in: ['active', 'pending'] } 
    });
    
    if (activeCampaigns.length > 0) {
      return sendErrorResponse(res, 'Cannot delete profile with active campaigns', 400);
    }
    
    // Delete user
    await User.findByIdAndDelete(userId);
    
    sendSuccessResponse(res, { message: 'Profile deleted successfully' });
  } catch (error) {
    sendErrorResponse(res, 'Failed to delete profile', 500);
  }
});

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private/Admin
export const getAllUsers = asyncHandler(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const users = await User.find()
      .select('-password')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    
    const total = await User.countDocuments();
    
    sendSuccessResponse(res, {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error getting users:', error);
    sendErrorResponse(res, 'Failed to get users', 500);
  }
});

// @desc    Update user profile
// @route   PATCH /api/users/profile
// @access  Private
export const updateProfile = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    const { name, email, phone, bio, location, dateOfBirth, socialLinks, preferences } = req.body;
    
    // Find user by ID
    const user = await User.findById(userId);
    
    if (!user) {
      return sendErrorResponse(res, 'User not found', 404);
    }
    
    // Validate email uniqueness if email is being updated
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return sendErrorResponse(res, 'Email already exists', 400);
      }
      user.email = email;
    }
    
    // Update user fields
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (bio) user.bio = bio;
    
    // Handle address/location
    if (location) {
      if (typeof location === 'string') {
        // If location is a string, store it in the address.city field
        if (!user.address) user.address = {};
        user.address.city = location;
      } else if (typeof location === 'object') {
        // If location is an object, update the address fields
        user.address = { ...user.address, ...location };
      }
    }
    
    // Handle date of birth
    if (dateOfBirth) user.dateOfBirth = dateOfBirth;
    
    // Handle social links
    if (socialLinks) {
      user.socialLinks = { ...user.socialLinks, ...socialLinks };
    }
    
    // Handle preferences
    if (preferences) {
      user.preferences = { ...user.preferences, ...preferences };
    }
    
    // Save updated user
    const updatedUser = await user.save();
    
    // Return updated user without sensitive fields
    const userResponse = {
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      bio: updatedUser.bio,
      address: updatedUser.address,
      dateOfBirth: updatedUser.dateOfBirth,
      socialLinks: updatedUser.socialLinks,
      preferences: updatedUser.preferences,
      avatar: updatedUser.avatar,
      stats: updatedUser.stats,
      badges: updatedUser.badges,
      isVerified: updatedUser.isVerified
    };
    
    sendSuccessResponse(res, { user: userResponse });
  } catch (error) {
    console.warn('Error updating profile:', error);
    // Check if it's a validation error
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return sendErrorResponse(res, messages.join(', '), 400);
    }
    // Check for duplicate key error (email)
    if (error.code === 11000) {
      return sendErrorResponse(res, 'Email already exists', 400);
    }
    sendErrorResponse(res, 'Failed to update profile', 500);
  }
});

// @desc    Get user statistics
// @route   GET /api/users/stats
// @access  Private
export const getUserStats = asyncHandler(async (req, res) => {
  try {
    // Get user ID from authenticated request
    const userId = req.user._id;

    // Get campaigns created by user
    const campaigns = await Campaign.find({ creator: userId });
    const campaignsCreated = campaigns.length;

    // Get donations made by user
    const donationsMade = await Donation.find({ donor: userId }).populate('campaign', 'title');
    const totalDonationsMade = donationsMade.length;
    
    // Calculate total amount donated
    const totalAmountDonated = donationsMade.reduce((total, donation) => {
      return total + (parseFloat(donation.amount) || 0);
    }, 0);

    // Get donations received for user's campaigns
    const campaignIds = campaigns.map(campaign => campaign._id);
    const donationsReceived = await Donation.find({ 
      campaign: { $in: campaignIds },
      status: 'completed' // Only count completed donations
    });
    const totalDonationsReceived = donationsReceived.length;
    
    // Calculate total amount raised
    const totalRaised = donationsReceived.reduce((total, donation) => {
      return total + (parseFloat(donation.amount) || 0);
    }, 0);

    // Calculate campaigns funded (unique campaigns user has donated to)
    const uniqueCampaignsDonatedTo = new Set(donationsMade.map(donation => 
      donation.campaign?._id?.toString() || donation.campaign?.toString()
    ).filter(id => id)); // Filter out any undefined values
    const campaignsFunded = uniqueCampaignsDonatedTo.size;

    // Calculate success rate (completed campaigns / total campaigns)
    const successfulCampaigns = campaigns.filter(campaign => 
      campaign.status === 'successful' || campaign.status === 'completed'
    ).length;
    const successRate = campaignsCreated > 0 
      ? Math.round((successfulCampaigns / campaignsCreated) * 100) 
      : 0;

    // Return stats
    sendSuccessResponse(res, {
      totalDonationsReceived,
      totalDonationsMade,
      campaignsCreated,
      campaignsFunded,
      totalRaised,
      totalAmountDonated,
      successRate
    });
  } catch (error) {
    console.error('Error getting user stats:', error);
    sendErrorResponse(res, 'Failed to retrieve user statistics', 500);
  }
});