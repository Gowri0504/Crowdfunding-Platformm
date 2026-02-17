import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaHeart, FaDollarSign, FaUser, FaCalendar, FaShare, FaCreditCard, FaPaypal, FaLock } from 'react-icons/fa';
import axios from '../../axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

const Donate = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [donating, setDonating] = useState(false);
  const [amount, setAmount] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [message, setMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('stripe');

  const predefinedAmounts = [10, 25, 50, 100, 250, 500];

  useEffect(() => {
    fetchCampaign();
  }, [id]);

  const fetchCampaign = async () => {
    try {
      const response = await axios.get(`/api/campaigns/${id}`);
      // Server sends: { success: true, message, data: { campaign, stats, recentDonations, commentsCount } }
      if (response.data && response.data.data && response.data.data.campaign) {
        setCampaign(response.data.data.campaign);
      } else {
        throw new Error('Invalid campaign data structure');
      }
    } catch (error) {
      toast.error('Campaign not found');
      navigate('/campaigns');
    } finally {
      setLoading(false);
    }
  };

  const handleAmountSelect = (selectedAmount) => {
    setAmount(selectedAmount);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (e) => {
    const value = e.target.value;
    setCustomAmount(value);
    setAmount(value);
  };

  const handleDonate = async (e) => {
    e.preventDefault();

    if (!user) {
      toast.error('Please login to donate');
      navigate('/login');
      return;
    }

    const donationAmount = parseFloat(amount);
    if (!donationAmount || donationAmount < 1) {
      toast.error('Please enter a valid amount (minimum $1)');
      return;
    }

    setDonating(true);

    try {
      if (paymentMethod === 'stripe') {
        try {
          await handleStripePayment(donationAmount);
        } catch (stripeError) {
          console.error('Stripe payment failed:', stripeError);
          toast.error('Stripe payment failed. Trying Razorpay instead...');
          // Fall back to Razorpay if Stripe fails
          await handleRazorpayPayment(donationAmount);
        }
      } else if (paymentMethod === 'razorpay') {
        await handleRazorpayPayment(donationAmount);
      }
    } catch (error) {
      console.error('Donation error:', error);
      toast.error('Failed to initiate payment');
    } finally {
      setDonating(false);
    }
  };

  const handleStripePayment = async (donationAmount) => {
    try {
      // Create Stripe payment intent
      const { data } = await axios.post('/api/payments/stripe/create-intent', {
        amount: donationAmount,
        currency: 'usd',
        campaignId: id,
        donorEmail: user.email
      });

      // Navigate to payment processing page with payment data
      navigate('/payment/process', {
        state: {
          clientSecret: data.clientSecret,
          paymentIntentId: data.paymentIntentId,
          amount: donationAmount,
          campaignId: id,
          message,
          isAnonymous
        }
      });
    } catch (error) {
      throw error;
    }
  };

  const handleRazorpayPayment = async (donationAmount) => {
    try {
      // Create Razorpay order
      const { data } = await axios.post('/api/payments/razorpay/create-order', {
        amount: donationAmount * 100, // Convert to paise
        currency: 'INR',
        campaignId: id
      });

      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID,
        amount: data.order.amount,
        currency: data.order.currency,
        name: campaign.title,
        description: `Donation to ${campaign.title}`,
        order_id: data.order.id,
        handler: async (response) => {
          try {
            // Verify payment
            await axios.post('/api/payments/razorpay/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              campaignId: id,
              amount: donationAmount,
              message,
              isAnonymous
            });

            toast.success('Donation successful!');
            navigate(`/campaigns/${id}?donated=true`);
          } catch (error) {
            toast.error('Payment verification failed');
          }
        },
        prefill: {
          name: user.name,
          email: user.email
        },
        theme: {
          color: '#3B82F6'
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Campaign not found</h2>
          <Link to="/campaigns" className="btn-primary">
            Browse Campaigns
          </Link>
        </div>
      </div>
    );
  }

  const progressPercentage = Math.min((campaign.raisedAmount / campaign.targetAmount) * 100, 100);
  const daysLeft = Math.max(0, Math.ceil((new Date(campaign.deadline) - new Date()) / (1000 * 60 * 60 * 24)));

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-lg overflow-hidden"
        >
          {/* Campaign Header */}
          <div className="relative h-64 bg-gradient-to-r from-primary-600 to-primary-800">
            {campaign.images && campaign.images.length > 0 && (
              <img
                src={campaign.images[0]?.url || campaign.images[0]}
                alt={campaign.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.style.display = 'none';
                  e.target.parentNode.innerHTML = '<div class="w-full h-full bg-gray-200 flex items-center justify-center"><span class="text-gray-500 text-lg">Image not available</span></div>';
                }}
              />
            )}
            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-end">
              <div className="p-6 text-white">
                <h1 className="text-3xl font-bold mb-2">{campaign.title}</h1>
                <p className="text-lg opacity-90">{campaign.description}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-6">
            {/* Campaign Info */}
            <div className="lg:col-span-2">
              {/* Progress */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-2xl font-bold text-gray-900">
                    ${campaign.raisedAmount?.toLocaleString() || 0}
                  </span>
                  <span className="text-gray-600">
                    of ${campaign.targetAmount?.toLocaleString()} goal
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                  <div
                    className="bg-primary-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>{campaign.donorsCount || 0} donors</span>
                  <span>{daysLeft} days left</span>
                </div>
              </div>

              {/* Campaign Details */}
              <div className="prose max-w-none">
                <h3 className="text-xl font-semibold mb-4">About this campaign</h3>
                <p className="text-gray-700 leading-relaxed">{campaign.story}</p>
              </div>
            </div>

            {/* Donation Form */}
            <div className="lg:col-span-1">
              <div className="sticky top-6">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-xl font-semibold mb-4 flex items-center">
                    <FaHeart className="text-red-500 mr-2" />
                    Make a Donation
                  </h3>

                  <form onSubmit={handleDonate} className="space-y-4">
                    {/* Amount Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Amount
                      </label>
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        {predefinedAmounts.map((preAmount) => (
                          <button
                            key={preAmount}
                            type="button"
                            onClick={() => handleAmountSelect(preAmount)}
                            className={`p-2 text-sm font-medium rounded-md border transition-colors ${
                              amount == preAmount
                                ? 'bg-primary-600 text-white border-primary-600'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            ${preAmount}
                          </button>
                        ))}
                      </div>
                      <div className="relative">
                        <FaDollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="number"
                          placeholder="Custom amount"
                          value={customAmount}
                          onChange={handleCustomAmountChange}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          min="1"
                        />
                      </div>
                    </div>

                    {/* Message */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Message (Optional)
                      </label>
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Leave a message for the campaign creator..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        rows="3"
                      />
                    </div>

                    {/* Anonymous Option */}
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="anonymous"
                        checked={isAnonymous}
                        onChange={(e) => setIsAnonymous(e.target.checked)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label htmlFor="anonymous" className="ml-2 text-sm text-gray-700">
                        Donate anonymously
                      </label>
                    </div>

                    {/* Payment Method */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Payment Method
                      </label>
                      <div className="space-y-2">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="stripe"
                            checked={paymentMethod === 'stripe'}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                          />
                          <FaCreditCard className="ml-2 mr-2 text-gray-500" />
                          <span className="text-sm text-gray-700">Stripe (Credit/Debit Card)</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="razorpay"
                            checked={paymentMethod === 'razorpay'}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                          />
                          <FaPaypal className="ml-2 mr-2 text-gray-500" />
                          <span className="text-sm text-gray-700">Razorpay (UPI/Wallet/NetBanking/Card)</span>
                        </label>
                      </div>
                    </div>

                    {/* Donate Button */}
                    <button
                      type="submit"
                      disabled={!amount || donating}
                      className="w-full btn-primary disabled:opacity-50 flex items-center justify-center"
                    >
                      {donating ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <FaLock className="mr-2" />
                          Donate ${amount || '0'}
                        </>
                      )}
                    </button>
                  </form>

                  {/* Security Notice */}
                  <div className="mt-4 p-3 bg-blue-50 rounded-md">
                    <div className="flex items-center">
                      <FaLock className="text-blue-500 mr-2" />
                      <span className="text-sm text-blue-700">
                        Your payment is secured with 256-bit SSL encryption
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Donate;