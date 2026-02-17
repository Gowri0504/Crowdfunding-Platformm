import { Cashfree } from 'cashfree-pg';
import Stripe from 'stripe';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import Donation from '../models/Donation.js';
import Campaign from '../models/Campaign.js';
import User from '../models/User.js';
import { sendSuccessResponse, sendErrorResponse, asyncHandler } from '../middleware/error.js';
import Notification from '../models/Notification.js';
import { sendDonationConfirmation } from '../utils/emailService.js';
import monthlyEmailService from '../utils/monthlyEmailService.js';

Cashfree.XClientId = process.env.CASHFREE_CLIENT_ID;
Cashfree.XClientSecret = process.env.CASHFREE_CLIENT_SECRET;
Cashfree.XEnvironment = process.env.CASHFREE_ENVIRONMENT || 'SANDBOX';

let stripe;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
} else {
  console.warn('STRIPE_SECRET_KEY not provided. Stripe payments are disabled.');
}

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// @desc    Create Stripe payment intent
// @route   POST /api/payments/stripe/create-intent
// @access  Private
export const createStripePaymentIntent = asyncHandler(async (req, res) => {
  if (!stripe) {
    return sendErrorResponse(res, 'Stripe is not configured', 503);
  }
  const { amount, campaignId, isAnonymous = false, donorEmail } = req.body;

  try {
    // Validate campaign exists
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return sendErrorResponse(res, 'Campaign not found', 404);
    }

    // Ensure we have a valid user
    if (!req.user || !req.user._id) {
      return sendErrorResponse(res, 'User authentication required', 401);
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: campaign.currency?.toLowerCase() || 'usd',
      metadata: {
        campaignId,
        donorId: req.user._id.toString(),
        amount: amount.toString(), // Include amount in metadata for webhook
        donorEmail: donorEmail || req.user.email,
        isAnonymous: isAnonymous.toString(),
        campaignTitle: campaign.title
      },
      receipt_email: donorEmail || req.user.email,
      description: `Donation to ${campaign.title}`
    });

    sendSuccessResponse(res, { 
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    console.error('Stripe payment intent creation failed:', error);
    sendErrorResponse(res, error.message || 'Failed to create payment intent', 500);
  }
});

// @desc    Create Razorpay order
// @route   POST /api/payments/razorpay/create-order
// @access  Private
export const createRazorpayOrder = asyncHandler(async (req, res) => {
  const { amount, currency = 'INR', campaignId } = req.body;

  try {
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return sendErrorResponse(res, 'Campaign not found', 404);
    }

    if (!req.user || !req.user._id) {
      return sendErrorResponse(res, 'User authentication required', 401);
    }

    const options = {
      amount: Math.round(amount),
      currency: currency.toUpperCase(),
      receipt: `rcpt_${campaignId}_${Date.now()}`,
      notes: {
        campaignId: campaignId.toString(),
        donorId: req.user._id.toString()
      }
    };

    const order = await razorpay.orders.create(options);

    sendSuccessResponse(res, { order });
  } catch (error) {
    console.error('Razorpay order creation failed:', error);
    sendErrorResponse(res, 'Failed to create Razorpay order', 500);
  }
});

// @desc    Create Cashfree order
// @route   POST /api/payments/cashfree/create-order
// @access  Private
export const createCashfreeOrder = asyncHandler(async (req, res) => {
  const { amount, currency = 'INR', campaignId } = req.body;

  try {
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const request = {
      order_amount: parseFloat(amount),
      order_currency: currency.toUpperCase(),
      order_id: orderId,
      customer_details: {
        customer_id: req.user._id.toString(),
        customer_name: req.user.name,
        customer_email: req.user.email,
        customer_phone: req.user.phone || '9999999999'
      },
      order_meta: {
        return_url: `${process.env.CLIENT_URL}/payment/success?order_id={order_id}`,
        notify_url: `${process.env.SERVER_URL}/api/payments/cashfree/webhook`
      },
      order_note: `Payment for campaign: ${campaignId}`
    };

    const response = await Cashfree.PGCreateOrder('2023-08-01', request);
    sendSuccessResponse(res, { order: response.data });
  } catch (error) {
    console.error('Cashfree order creation failed:', error);
    sendErrorResponse(res, 'Failed to create payment order', 500);
  }
});

// @desc    Handle Cashfree webhook
// @route   POST /api/payments/cashfree/webhook
// @access  Public
export const handleCashfreeWebhook = asyncHandler(async (req, res) => {
  try {
    const { type, data } = req.body;
    
    if (type === 'PAYMENT_SUCCESS_WEBHOOK') {
      const { order } = data;
      
      // Verify payment status
      const paymentDetails = await Cashfree.PGOrderFetchPayments('2023-08-01', order.order_id);
      
      if (paymentDetails.data && paymentDetails.data.length > 0) {
        const payment = paymentDetails.data[0];
        
        if (payment.payment_status === 'SUCCESS') {
          // Extract campaign info from order note
          const campaignId = order.order_note.split(': ')[1];
          
          // Create donation record
          const donation = await createDonationRecord({
            donorId: order.customer_details.customer_id,
            campaignId,
            amount: order.order_amount,
            message: '',
            isAnonymous: false,
            paymentMethod: 'cashfree',
            transactionId: payment.cf_payment_id,
            gatewayTransactionId: order.order_id,
            paymentStatus: 'completed'
          });
          
          // Send notification to all donors of this campaign
          await sendDonationUpdateNotification(campaignId, donation);
        }
      }
    }
    
    res.status(200).json({ status: 'OK' });
  } catch (error) {
    console.error('Cashfree webhook handling failed:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});


// @desc    Handle Stripe webhook
// @route   POST /api/payments/stripe/webhook
// @access  Public (webhook)
export const handleStripeWebhook = asyncHandler(async (req, res) => {
  if (!stripe) {
    return res.status(503).json({ error: 'Stripe is not configured' });
  }
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      
      try {
        // Extract metadata
        const { campaignId, donorId, amount } = paymentIntent.metadata;
        
        if (!campaignId || !donorId || !amount) {
          console.error('Missing required metadata in payment intent:', paymentIntent.metadata);
          return res.status(400).json({ error: 'Missing required metadata' });
        }

        // Create donation record
        const donation = await createDonationRecord({
          donorId,
          campaignId,
          amount: parseFloat(amount),
          message: paymentIntent.metadata.message || '',
          isAnonymous: paymentIntent.metadata.isAnonymous === 'true',
          paymentMethod: 'stripe',
          transactionId: paymentIntent.id,
          gatewayTransactionId: paymentIntent.id,
          paymentStatus: 'completed'
        });

        // Send notification to all donors of this campaign
        await sendDonationUpdateNotification(campaignId, donation);

        console.log('Stripe payment processed successfully:', paymentIntent.id);
      } catch (error) {
        console.error('Error processing Stripe payment:', error);
        return res.status(500).json({ error: 'Payment processing failed' });
      }
      break;

    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      console.log('Payment failed:', failedPayment.id);
      // Handle failed payment if needed
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

// @desc    Verify Razorpay payment
// @route   POST /api/payments/razorpay/verify
// @access  Private
export const verifyRazorpayPayment = asyncHandler(async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    campaignId,
    amount,
    message,
    isAnonymous = false
  } = req.body;

  try {
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return sendErrorResponse(res, 'Invalid payment signature', 400);
    }

    const donation = await createDonationRecord({
      donorId: req.user._id,
      campaignId,
      amount,
      message,
      isAnonymous,
      paymentMethod: 'razorpay',
      transactionId: razorpay_payment_id,
      gatewayTransactionId: razorpay_order_id,
      paymentStatus: 'completed'
    });

    await sendDonationUpdateNotification(campaignId, donation);

    sendSuccessResponse(res, { donation }, 'Payment verified successfully');
  } catch (error) {
    console.error('Razorpay payment verification failed:', error);
    sendErrorResponse(res, 'Failed to verify Razorpay payment', 500);
  }
});

// @desc    Process refund
// @route   POST /api/payments/refund
// @access  Private
export const processRefund = asyncHandler(async (req, res) => {
  const { donationId, reason } = req.body;

  try {
    const donation = await Donation.findById(donationId).populate('campaign');
    
    if (!donation) {
      return sendErrorResponse(res, 'Donation not found', 404);
    }

    // Check authorization
    if (donation.donor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return sendErrorResponse(res, 'Not authorized to refund this donation', 403);
    }

    let refund;
    if (donation.paymentMethod === 'cashfree') {
      refund = await Cashfree.PGOrderCreateRefund('2023-08-01', {
        order_id: donation.gatewayTransactionId,
        refund_amount: donation.amount,
        refund_id: `refund_${Date.now()}`,
        refund_note: reason
      });
    } else {
      return sendErrorResponse(res, 'Refund not supported for this payment method', 400);
    }

    // Update donation status
    donation.paymentStatus = 'refunded';
    donation.refund = {
      requested: true,
      processed: true,
      amount: donation.amount,
      reason,
      processedAt: new Date(),
      processedBy: req.user._id,
      gatewayRefundId: refund.id
    };
    await donation.save();

    // Update campaign raised amount
    const campaign = donation.campaign;
    campaign.raisedAmount -= donation.amount;
    campaign.donorsCount -= 1;
    await campaign.save();

    sendSuccessResponse(res, { refund }, 'Refund processed successfully');
  } catch (error) {
    console.error('Refund processing failed:', error);
    sendErrorResponse(res, 'Failed to process refund', 500);
  }
});

// Helper function to create donation record
const createDonationRecord = async (data) => {
  const { donorId, campaignId, amount, message, isAnonymous, paymentMethod, transactionId, gatewayTransactionId, paymentStatus } = data;

  // Create donation
  const donation = await Donation.create({
    donor: donorId,
    campaign: campaignId,
    amount,
    message: message || '',
    isAnonymous: isAnonymous || false,
    paymentMethod,
    transactionId,
    gatewayTransactionId,
    paymentStatus
  });

  // Update campaign
  const campaign = await Campaign.findById(campaignId);
  campaign.raisedAmount += amount;
  campaign.donorsCount += 1;
  await campaign.save();

  // Populate donation for response
  await donation.populate([
    { path: 'donor', select: 'name avatar email' },
    { path: 'campaign', select: 'title creator' }
  ]);

  // Send donation confirmation email
  try {
    await sendDonationConfirmation({
      donation,
      campaign,
      donor: donation.donor
    });

    // Send immediate thank you email using monthly email service
    await monthlyEmailService.sendImmediateThankYou({
      donation,
      campaign,
      donor: donation.donor
    });
  } catch (emailError) {
    console.error('Failed to send donation confirmation email:', emailError);
    // Don't fail the donation process if email fails
  }

  // Emit real-time update
  const io = global.io;
  if (io) {
    io.to(`campaign-${campaignId}`).emit('new-donation', {
      donation: {
        _id: donation._id,
        amount: donation.amount,
        donor: isAnonymous ? { name: 'Anonymous' } : { name: donation.donor.name, avatar: donation.donor.avatar },
        message: donation.message,
        createdAt: donation.createdAt
      },
      campaign: {
        raisedAmount: campaign.raisedAmount,
        donorsCount: campaign.donorsCount
      }
    });
  }

  return donation;
};



// Helper function to send donation update notifications
const sendDonationUpdateNotification = async (campaignId, newDonation) => {
  try {
    // Get campaign details with all donations
    const campaign = await Campaign.findById(campaignId)
      .populate('creator', 'name email')
      .populate({
        path: 'donations',
        populate: {
          path: 'donor',
          select: 'name email'
        }
      });

    if (!campaign) return;

    // Get all unique donor IDs (excluding anonymous donations and the new donor)
    const donorIds = [...new Set(
      campaign.donations
        .filter(donation => donation._id.toString() !== newDonation._id.toString())
        .filter(donation => !donation.isAnonymous && donation.donor)
        .map(donation => donation.donor._id)
    )];

    if (donorIds.length === 0) return;

    // Create in-app notifications for all previous donors
    const notifications = donorIds.map(donorId => ({
      recipient: donorId,
      type: 'campaign_update',
      title: 'New Donation Update',
      message: `A new donation of ₹${newDonation.amount} was made to "${campaign.title}" campaign you supported!`,
      data: {
        campaignId: campaignId,
        donationAmount: newDonation.amount,
        donorName: newDonation.isAnonymous ? 'Anonymous' : newDonation.donor?.name || 'Anonymous',
        campaignTitle: campaign.title,
        totalRaised: campaign.raisedAmount,
        goalAmount: campaign.goalAmount,
        progress: Math.round((campaign.raisedAmount / campaign.goalAmount) * 100)
      }
    }));

    await Notification.insertMany(notifications);
    // Notification functionality removed
  } catch (error) {
    console.error('Error sending donation update notifications:', error);
  }
};
