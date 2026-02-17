import Donation from '../models/Donation.js';
import Campaign from '../models/Campaign.js';
import User from '../models/User.js';
import { sendSuccessResponse, sendErrorResponse, asyncHandler } from '../middleware/error.js';
import { validationResult } from 'express-validator';
import { generateDonationQR } from '../utils/qrGenerator.js';
import { sendDonationConfirmation } from '../utils/emailService.js';
import mongoose from 'mongoose';

// @desc    Create donation
// @route   POST /api/donations
// @access  Private
export const createDonation = asyncHandler(async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => error.msg);
    return sendErrorResponse(res, errorMessages.join(', '), 400);
  }

  const { 
    campaignId, 
    amount, 
    message, 
    isAnonymous, 
    paymentMethod,
    donorName,
    donorEmail,
    donorPhone,
    donorAddress,
    qrCodeUsed 
  } = req.body;

  // Validate input
  if (!campaignId || !amount || amount <= 0) {
    return sendErrorResponse(res, 'Campaign ID and valid amount are required', 400);
  }

  // Check if campaign exists and is active
  const campaign = await Campaign.findById(campaignId).populate('creator', 'name email');
  if (!campaign) {
    return sendErrorResponse(res, 'Campaign not found', 404);
  }

  if (campaign.status !== 'active') {
    return sendErrorResponse(res, 'Campaign is not active', 400);
  }

  if (new Date() > campaign.deadline) {
    return sendErrorResponse(res, 'Campaign has ended', 400);
  }

  // Calculate fees
  const platformFeeRate = 0.05; // 5% platform fee
  const paymentGatewayFeeRate = 0.029; // 2.9% payment gateway fee
  const platformFee = Math.round(amount * platformFeeRate * 100) / 100;
  const paymentGatewayFee = Math.round(amount * paymentGatewayFeeRate * 100) / 100;
  const netAmount = Math.round((amount - platformFee - paymentGatewayFee) * 100) / 100;

  // Generate donation QR code for verification with enhanced data
  const donationQR = await generateDonationQR({
    donationId: `TEMP_${Date.now()}`, // Temporary ID, will be updated after creation
    campaignId,
    amount,
    transactionId: `TXN_${Date.now()}`,
    donorName: donorName || req.user.name,
    campaignTitle: campaign.title
  });

  // Create donation with enhanced donor details
  const donation = await Donation.create({
    donor: req.user._id,
    campaign: campaignId,
    amount,
    message: message || '',
    isAnonymous: isAnonymous || false,
    paymentMethod: paymentMethod || 'card',
    paymentStatus: 'pending', // Set to pending until payment is confirmed
    fees: {
      platformFee,
      paymentGatewayFee,
      netAmount
    },
    donorDetails: {
      name: donorName || req.user.name,
      email: donorEmail || req.user.email,
      phone: donorPhone || '',
      address: donorAddress || ''
    },
    paymentDetails: {
      qrCodeUsed: qrCodeUsed || false,
      paymentUrl: donationQR.success ? donationQR.data.verificationUrl : '',
      transactionId: `TXN_${Date.now()}`,
      paymentGateway: paymentMethod || 'card',
      qrCodeData: donationQR.success ? donationQR.data.qrData : null,
      qrCodeImage: donationQR.success ? donationQR.data.qrCodeImage : null
    },
    notificationStatus: {
      donorNotified: false,
      receiptSent: false,
      campaignUpdatesSubscribed: true
    }
  });

  // Update donation with actual ID in QR code after creation
  if (donationQR.success) {
    const updatedDonationQR = await generateDonationQR({
      donationId: donation._id,
      campaignId,
      amount,
      transactionId: donation.paymentDetails.transactionId,
      donorName: donorName || req.user.name,
      campaignTitle: campaign.title
    });
    
    if (updatedDonationQR.success) {
      donation.paymentDetails.qrCodeData = updatedDonationQR.data.qrData;
      donation.paymentDetails.qrCodeImage = updatedDonationQR.data.qrCodeImage;
      donation.paymentDetails.paymentUrl = updatedDonationQR.data.verificationUrl;
      await donation.save();
    }
  }

  // Update campaign raised amount
  campaign.raisedAmount += amount;
  campaign.donorsCount += 1;
  await campaign.save();

  // Populate donation for response
  await donation.populate([
    { path: 'donor', select: 'name avatar' },
    { path: 'campaign', select: 'title creator' }
  ]);

  // Send donation confirmation email
  try {
    const emailResult = await sendDonationConfirmation(donation, campaign);
    if (emailResult.success) {
      donation.notificationStatus.donorNotified = true;
      await donation.save();
    }
  } catch (emailError) {
    console.error('Error sending donation confirmation:', emailError);
  }

  // Emit real-time update
  const io = req.app.get('io');
  if (io) {
    io.to(`campaign-${campaignId}`).emit('new-donation', {
      donation: {
        _id: donation._id,
        amount: donation.amount,
        donor: isAnonymous ? { name: 'Anonymous' } : { name: req.user.name, avatar: req.user.avatar },
        message: donation.message,
        createdAt: donation.createdAt
      },
      campaign: {
        raisedAmount: campaign.raisedAmount,
        donorsCount: campaign.donorsCount
      }
    });
  }

  sendSuccessResponse(res, { 
    donation,
    qrCode: donationQR 
  }, 'Donation successful', 201);
});

// @desc    Update donation status
// @route   PATCH /api/donations/:id/status
// @access  Private
export const updateDonationStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return sendErrorResponse(res, 'Invalid donation ID', 400);
  }
  
  // Validate status
  if (!status || !['pending', 'completed', 'failed', 'refunded'].includes(status)) {
    return sendErrorResponse(res, 'Invalid status', 400);
  }
  
  const donation = await Donation.findById(id);
  
  if (!donation) {
    return sendErrorResponse(res, 'Donation not found', 404);
  }
  
  // Only update campaign raised amount if status is changing to completed
  if (status === 'completed' && donation.status !== 'completed') {
    const campaign = await Campaign.findById(donation.campaign);
    if (campaign) {
      campaign.raisedAmount += donation.amount;
      campaign.donorsCount += 1;
      await campaign.save();
    }
  }
  
  // Update donation status
  donation.status = status;
  await donation.save();
  
  sendSuccessResponse(res, { donation }, 'Donation status updated');
});

// @desc    Get donation
// @route   GET /api/donations/:id
// @access  Private
export const getDonation = asyncHandler(async (req, res) => {
  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return sendErrorResponse(res, 'Invalid donation ID', 400);
  }

  const donation = await Donation.findById(req.params.id)
    .populate('donor', 'name avatar email')
    .populate('campaign', 'title creator');

  if (!donation) {
    return sendErrorResponse(res, 'Donation not found', 404);
  }

  // Check if user is the donor or campaign creator
  if (
    donation.donor._id.toString() !== req.user._id.toString() &&
    donation.campaign.creator.toString() !== req.user._id.toString() &&
    req.user.role !== 'admin'
  ) {
    return sendErrorResponse(res, 'Not authorized to view this donation', 403);
  }

  sendSuccessResponse(res, { donation });
});

// @desc    Get user donations
// @route   GET /api/donations/user
// @access  Private
export const getUserDonations = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  const skip = (page - 1) * limit;

  // Get donations made by the user
  const madeQuery = { donor: req.user._id };
  if (status) {
    madeQuery.status = status;
  }

  const donationsMade = await Donation.find(madeQuery)
    .populate('campaign', 'title images creator status')
    .populate('donor', 'name avatar')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  // Get user's campaigns to find donations received
  const userCampaigns = await Campaign.find({ creator: req.user._id }).select('_id');
  const campaignIds = userCampaigns.map(campaign => campaign._id);

  // Get donations received on user's campaigns
  const receivedQuery = { campaign: { $in: campaignIds } };
  if (status) {
    receivedQuery.status = status;
  }

  const donationsReceived = await Donation.find(receivedQuery)
    .populate('campaign', 'title images creator status')
    .populate('donor', 'name avatar')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  const totalMade = await Donation.countDocuments(madeQuery);
  const totalReceived = await Donation.countDocuments(receivedQuery);
  const totalPages = Math.ceil(Math.max(totalMade, totalReceived) / limit);

  sendSuccessResponse(res, {
    made: donationsMade,
    received: donationsReceived,
    pagination: {
      currentPage: Number(page),
      totalPages,
      totalMade,
      totalReceived,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      limit: Number(limit)
    }
  });
});

// @desc    Get campaign donations
// @route   GET /api/donations/campaign/:campaignId
// @access  Public
export const getCampaignDonations = asyncHandler(async (req, res) => {
  const { campaignId } = req.params;
  
  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(campaignId)) {
    return sendErrorResponse(res, 'Invalid campaign ID', 400);
  }
  
  const { page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  const donations = await Donation.find({
    campaign: campaignId,
    status: 'completed'
  })
    .populate('donor', 'name avatar')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  // Filter anonymous donations
  const filteredDonations = donations.map(donation => ({
    _id: donation._id,
    amount: donation.amount,
    message: donation.message,
    createdAt: donation.createdAt,
    donor: donation.isAnonymous ? { name: 'Anonymous' } : donation.donor
  }));

  const total = await Donation.countDocuments({
    campaign: campaignId,
    status: 'completed'
  });
  const totalPages = Math.ceil(total / limit);

  sendSuccessResponse(res, {
    donations: filteredDonations,
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

// @desc    Request refund
// @route   POST /api/donations/:id/refund
// @access  Private
export const requestRefund = asyncHandler(async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => error.msg);
    return sendErrorResponse(res, errorMessages.join(', '), 400);
  }

  const { reason } = req.body;

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return sendErrorResponse(res, 'Invalid donation ID', 400);
  }
  const donation = await Donation.findById(req.params.id).populate('campaign');

  if (!donation) {
    return sendErrorResponse(res, 'Donation not found', 404);
  }

  // Check if user is the donor
  if (donation.donor.toString() !== req.user._id.toString()) {
    return sendErrorResponse(res, 'Not authorized to request refund for this donation', 403);
  }

  if (donation.status !== 'completed') {
    return sendErrorResponse(res, 'Can only request refund for completed donations', 400);
  }

  // Check if campaign is still active (refunds only allowed for failed campaigns)
  if (donation.campaign.status === 'active') {
    return sendErrorResponse(res, 'Refunds are only available for failed or cancelled campaigns', 400);
  }

  donation.refundRequested = true;
  donation.refundReason = reason;
  donation.refundRequestedAt = new Date();
  await donation.save();

  sendSuccessResponse(res, null, 'Refund request submitted successfully');
});

// @desc    Get donation receipt
// @route   GET /api/donations/:id/receipt
// @access  Private
export const getReceipt = asyncHandler(async (req, res) => {
  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return sendErrorResponse(res, 'Invalid donation ID', 400);
  }

  const donation = await Donation.findById(req.params.id)
    .populate('donor', 'name email')
    .populate('campaign', 'title creator');

  if (!donation) {
    return sendErrorResponse(res, 'Donation not found', 404);
  }

  // Check if user is the donor
  if (donation.donor._id.toString() !== req.user._id.toString()) {
    return sendErrorResponse(res, 'Not authorized to view this receipt', 403);
  }

  const receipt = {
    donationId: donation._id,
    amount: donation.amount,
    currency: donation.currency,
    date: donation.createdAt,
    campaign: donation.campaign.title,
    donor: donation.donor.name,
    paymentMethod: donation.paymentMethod,
    transactionId: donation.transactionId
  };

  sendSuccessResponse(res, { receipt });
});

// Donation receipt email functionality removed
