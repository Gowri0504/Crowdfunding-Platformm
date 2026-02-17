// sendMail functionality removed
import Campaign from '../models/Campaign.js';
import User from '../models/User.js';
import Donation from '../models/Donation.js';
import mongoose from 'mongoose';
import { sendSuccessResponse, sendErrorResponse, asyncHandler } from '../middleware/error.js';
import { sendCampaignApprovalEmail, sendCampaignRejectionEmail } from '../utils/emailService.js';
import { generatePDF, generateFinancialReportHTML } from '../utils/pdfGenerator.js';

// @desc    Get pending campaigns for review
// @route   GET /api/admin/campaigns/pending
// @access  Private (Admin only)
export const getPendingCampaigns = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  const campaigns = await Campaign.find({ status: 'pending' })
    .populate('creator', 'name email avatar isVerified')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  const total = await Campaign.countDocuments({ status: 'pending' });
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

// @desc    Get all campaigns for admin review
// @route   GET /api/admin/campaigns
// @access  Private (Admin only)
export const getAllCampaignsForAdmin = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, search } = req.query;
  const skip = (page - 1) * limit;

  let query = {};
  if (status) {
    query.status = status;
  }
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  const campaigns = await Campaign.find(query)
    .populate('creator', 'name email avatar isVerified')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  const total = await Campaign.countDocuments(query);
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

// @desc    Approve campaign
// @route   PUT /api/admin/campaigns/:id/approve
// @access  Private (Admin only)
export const approveCampaign = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reviewNotes } = req.body;
  
  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return sendErrorResponse(res, 'Invalid campaign ID', 400);
  }
  
  const campaign = await Campaign.findByIdAndUpdate(
    id,
    { 
      status: 'active',
      'moderation.reviewedBy': req.user._id,
      'moderation.reviewedAt': new Date(),
      'moderation.reviewNotes': reviewNotes || 'Campaign approved'
    },
    { new: true }
  ).populate('creator', 'name email');

  if (!campaign) {
    return sendErrorResponse(res, 'Campaign not found', 404);
  }

  // Send approval email notification
  try {
    const emailResult = await sendCampaignApprovalEmail(campaign);
    if (!emailResult.success) {
      console.error('Failed to send approval email:', emailResult.error);
    }
  } catch (error) {
    console.error('Error sending approval email:', error);
  }

  sendSuccessResponse(res, { campaign }, 'Campaign approved successfully');
});

// @desc    Reject campaign
// @route   PUT /api/admin/campaigns/:id/reject
// @access  Private (Admin only)
export const rejectCampaign = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reviewNotes } = req.body;
  
  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return sendErrorResponse(res, 'Invalid campaign ID', 400);
  }
  
  if (!reviewNotes) {
    return sendErrorResponse(res, 'Review notes are required for rejection', 400);
  }
  
  const campaign = await Campaign.findByIdAndUpdate(
    id,
    { 
      status: 'rejected',
      'moderation.reviewedBy': req.user._id,
      'moderation.reviewedAt': new Date(),
      'moderation.reviewNotes': reviewNotes
    },
    { new: true }
  ).populate('creator', 'name email');

  if (!campaign) {
    return sendErrorResponse(res, 'Campaign not found', 404);
  }

  // Send rejection email notification
  try {
    const emailResult = await sendCampaignRejectionEmail(campaign);
    if (!emailResult.success) {
      console.error('Failed to send rejection email:', emailResult.error);
    }
  } catch (error) {
    console.error('Error sending rejection email:', error);
  }

  sendSuccessResponse(res, { campaign }, 'Campaign rejected successfully');
});

// @desc    Get all users for admin management
// @route   GET /api/admin/users
// @access  Private (Admin only)
export const getAllUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search, role, status } = req.query;
  const skip = (page - 1) * limit;

  let query = {};
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }
  if (role) {
    query.role = role;
  }
  if (status) {
    query.isActive = status === 'active';
  }

  const users = await User.find(query)
    .select('-password')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  const total = await User.countDocuments(query);
  const totalPages = Math.ceil(total / limit);

  sendSuccessResponse(res, {
    users,
    pagination: {
      currentPage: Number(page),
      totalPages,
      total
    }
  });
});

// @desc    Update user role
// @route   PUT /api/admin/users/:id/role
// @access  Private (Admin only)
export const updateUserRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return sendErrorResponse(res, 'Invalid user ID', 400);
  }

  if (!['user', 'admin'].includes(role)) {
    return sendErrorResponse(res, 'Invalid role. Must be user or admin', 400);
  }

  const user = await User.findByIdAndUpdate(
    id,
    { role },
    { new: true }
  ).select('-password');

  if (!user) {
    return sendErrorResponse(res, 'User not found', 404);
  }

  sendSuccessResponse(res, { user }, 'User role updated successfully');
});

// @desc    Toggle user status
// @route   PUT /api/admin/users/:id/status
// @access  Private (Admin only)
export const toggleUserStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { isActive } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return sendErrorResponse(res, 'Invalid user ID', 400);
  }

  const user = await User.findByIdAndUpdate(
    id,
    { isActive },
    { new: true }
  ).select('-password');

  if (!user) {
    return sendErrorResponse(res, 'User not found', 404);
  }

  sendSuccessResponse(res, { user }, `User ${isActive ? 'activated' : 'deactivated'} successfully`);
});

// @desc    Get analytics data
// @route   GET /api/admin/analytics
// @access  Private (Admin only)
export const getAnalytics = asyncHandler(async (req, res) => {
  // Get total counts
  const totalUsers = await User.countDocuments();
  const totalCampaigns = await Campaign.countDocuments();
  const activeCampaigns = await Campaign.countDocuments({ status: 'active' });
  const pendingCampaigns = await Campaign.countDocuments({ status: 'pending' });
  
  // Get donation statistics
  const donationStats = await Donation.aggregate([
    {
      $group: {
        _id: null,
        totalDonations: { $sum: 1 },
        totalRevenue: { $sum: '$amount' }
      }
    }
  ]);

  const totalDonations = donationStats[0]?.totalDonations || 0;
  const totalRevenue = donationStats[0]?.totalRevenue || 0;

  // Get recent activity (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentUsers = await User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });
  const recentCampaigns = await Campaign.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });
  const recentDonations = await Donation.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });

  // Get monthly revenue for the last 6 months
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const monthlyRevenue = await Donation.aggregate([
    {
      $match: {
        createdAt: { $gte: sixMonthsAgo }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        revenue: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1 }
    }
  ]);

  // Get top campaigns by donations
  const topCampaigns = await Campaign.aggregate([
    {
      $lookup: {
        from: 'donations',
        localField: '_id',
        foreignField: 'campaign',
        as: 'donations'
      }
    },
    {
      $addFields: {
        totalRaised: { $sum: '$donations.amount' },
        donationCount: { $size: '$donations' }
      }
    },
    {
      $sort: { totalRaised: -1 }
    },
    {
      $limit: 5
    },
    {
      $project: {
        title: 1,
        totalRaised: 1,
        donationCount: 1,
        goal: 1,
        status: 1
      }
    }
  ]);

  sendSuccessResponse(res, {
    overview: {
      totalUsers,
      totalCampaigns,
      activeCampaigns,
      pendingCampaigns,
      totalDonations,
      totalRevenue
    },
    recentActivity: {
      newUsers: recentUsers,
      newCampaigns: recentCampaigns,
      newDonations: recentDonations
    },
    monthlyRevenue,
    topCampaigns
  });
});

// @desc    Delete campaign
// @route   DELETE /api/admin/campaigns/:id
// @access  Private (Admin only)
export const deleteCampaign = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return sendErrorResponse(res, 'Invalid campaign ID', 400);
  }

  const campaign = await Campaign.findById(id);
  if (!campaign) {
    return sendErrorResponse(res, 'Campaign not found', 404);
  }

  await Campaign.findByIdAndDelete(id);
  sendSuccessResponse(res, { message: 'Campaign deleted successfully' });
});

// @desc    Generate financial report
// @route   GET /api/admin/reports/financial
// @access  Private (Admin only)
export const generateFinancialReport = asyncHandler(async (req, res) => {
  const { period = 'monthly', year, month, week } = req.query;
  
  let startDate, endDate;
  const now = new Date();
  
  // Calculate date range based on period
  switch (period) {
    case 'weekly':
      if (week && year) {
        // Calculate start of specific week
        const firstDayOfYear = new Date(year, 0, 1);
        const daysToAdd = (week - 1) * 7;
        startDate = new Date(firstDayOfYear.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
        endDate = new Date(startDate.getTime() + 6 * 24 * 60 * 60 * 1000);
      } else {
        // Current week
        const dayOfWeek = now.getDay();
        startDate = new Date(now.getTime() - dayOfWeek * 24 * 60 * 60 * 1000);
        endDate = new Date(startDate.getTime() + 6 * 24 * 60 * 60 * 1000);
      }
      break;
      
    case 'monthly':
      if (month && year) {
        startDate = new Date(year, month - 1, 1);
        endDate = new Date(year, month, 0);
      } else {
        // Current month
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      }
      break;
      
    case 'yearly':
      if (year) {
        startDate = new Date(year, 0, 1);
        endDate = new Date(year, 11, 31);
      } else {
        // Current year
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
      }
      break;
      
    default:
      return sendErrorResponse(res, 'Invalid period. Use weekly, monthly, or yearly', 400);
  }

  // Set end date to end of day
  endDate.setHours(23, 59, 59, 999);

  // Get donations within the period
  const donations = await Donation.find({
    createdAt: { $gte: startDate, $lte: endDate }
  }).populate('campaign', 'title category')
    .populate('donor', 'name email')
    .sort({ createdAt: -1 });

  // Calculate summary statistics
  const totalRevenue = donations.reduce((sum, donation) => sum + donation.amount, 0);
  const totalDonations = donations.length;
  const averageDonation = totalDonations > 0 ? totalRevenue / totalDonations : 0;

  // Group by category
  const categoryStats = {};
  donations.forEach(donation => {
    const category = donation.campaign?.category || 'Unknown';
    if (!categoryStats[category]) {
      categoryStats[category] = { count: 0, amount: 0 };
    }
    categoryStats[category].count++;
    categoryStats[category].amount += donation.amount;
  });

  // Group by day for trend analysis
  const dailyStats = {};
  donations.forEach(donation => {
    const day = donation.createdAt.toISOString().split('T')[0];
    if (!dailyStats[day]) {
      dailyStats[day] = { count: 0, amount: 0 };
    }
    dailyStats[day].count++;
    dailyStats[day].amount += donation.amount;
  });

  // Get top campaigns in this period
  const campaignStats = {};
  donations.forEach(donation => {
    const campaignId = donation.campaign?._id?.toString();
    const campaignTitle = donation.campaign?.title || 'Unknown Campaign';
    if (campaignId && !campaignStats[campaignId]) {
      campaignStats[campaignId] = { 
        title: campaignTitle, 
        count: 0, 
        amount: 0 
      };
    }
    if (campaignId) {
      campaignStats[campaignId].count++;
      campaignStats[campaignId].amount += donation.amount;
    }
  });

  const topCampaigns = Object.values(campaignStats)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10);

  // Prepare report data
  const reportData = {
    period,
    dateRange: {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    },
    summary: {
      totalRevenue,
      totalDonations,
      averageDonation: Math.round(averageDonation * 100) / 100
    },
    categoryBreakdown: categoryStats,
    dailyTrends: dailyStats,
    topCampaigns,
    donations: donations.map(donation => ({
      id: donation._id,
      amount: donation.amount,
      date: donation.createdAt,
      campaign: donation.campaign?.title || 'Unknown',
      category: donation.campaign?.category || 'Unknown',
      donor: donation.donor?.name || 'Anonymous',
      donorEmail: donation.donor?.email || 'N/A'
    }))
  };

  try {
    // Generate HTML content
    const htmlContent = generateFinancialReportHTML(reportData);
    
    // Generate PDF
    const pdfBuffer = await generatePDF(htmlContent);
    
    // Set response headers for PDF download
    const filename = `financial-report-${period}-${new Date().toISOString().split('T')[0]}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    // Send PDF buffer
    res.send(pdfBuffer);
  } catch (pdfError) {
    console.error('Error generating PDF:', pdfError);
    // Fallback to JSON response if PDF generation fails
    sendSuccessResponse(res, reportData);
  }
});
