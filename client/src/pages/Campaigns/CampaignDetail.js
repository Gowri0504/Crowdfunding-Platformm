import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Tab } from '@headlessui/react';
import { motion } from 'framer-motion';
import { 
  FaRegClock, FaRegHeart, FaRegBookmark, FaRegComment, 
  FaChevronLeft, FaChevronRight, FaMapMarkerAlt, FaTag, FaRegQuestionCircle,
  FaRegLightbulb, FaRegNewspaper, FaRegMoneyBillAlt, FaExclamationTriangle,
  FaShare, FaQrcode, FaCopy
} from 'react-icons/fa';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';
import sampleCampaigns from '../../data/sampleCampaigns';

import { campaignsAPI, commentsAPI, donationsAPI } from '../../services/api';
import axios from '../../axios';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { stripeService } from '../../services/stripeService';

const CampaignDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [donationAmount, setDonationAmount] = useState('');
  const [donationMessage, setDonationMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [recentDonations, setRecentDonations] = useState([]);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [loadingDonation, setLoadingDonation] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrCodeAmount, setQrCodeAmount] = useState('');
  
  // Define fetchCampaign function with useCallback - optimized for parallel requests
  const fetchCampaign = useCallback(async () => {
    try {
      setLoading(true);
      
      // Make all API calls in parallel using Promise.all
      const [campaignResponse, donationsResponse, commentsResponse] = await Promise.all([
        campaignsAPI.getCampaign(id),
        axios.get(`/api/donations/campaign/${id}`, { params: { limit: 5 } }),
        commentsAPI.getComments(id, { limit: 10 })
      ]);
      
      // Set all data at once
      // Server sends: { success: true, message, data: { campaign, stats, recentDonations, commentsCount } }
      if (campaignResponse.data && campaignResponse.data.data && campaignResponse.data.data.campaign) {
        setCampaign(campaignResponse.data.data.campaign);
      } else {
        throw new Error('Invalid campaign data structure');
      }
      
      setRecentDonations(donationsResponse.data?.donations || []);
      setComments(commentsResponse.data || []);
    } catch (err) {
      console.error('Error fetching campaign:', err);
      setError(err.message || 'Failed to load campaign details');
      
      // Use sample campaign data if there's a network error
      if (err.message === 'Network error') {
        const sampleCampaign = sampleCampaigns.find(campaign => campaign.id === id);
        if (sampleCampaign) {
          setCampaign(sampleCampaign);
          setRecentDonations(sampleCampaign.donations || []);
          setComments([]);
          toast.success('Loaded sample campaign data');
          setError(null);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Fetch campaign details
  useEffect(() => {
    fetchCampaign();
  }, [fetchCampaign, id]);
  
  // Listen for payment success events to hide QR code
  useEffect(() => {
    const handlePaymentSuccess = () => {
      setShowQRCode(false);
      setQrCodeAmount('');
      // Refresh campaign data after successful payment
      fetchCampaign();
    };

    // Listen for custom payment success event
    window.addEventListener('paymentSuccess', handlePaymentSuccess);
    
    // Also listen for storage events (in case payment happens in another tab)
    const handleStorageChange = (e) => {
      if (e.key === 'paymentSuccess' && e.newValue) {
        handlePaymentSuccess();
        // Clear the storage flag
        localStorage.removeItem('paymentSuccess');
      }
    };
    
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('paymentSuccess', handlePaymentSuccess);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [fetchCampaign]);
  
  // Handle image navigation
  const nextImage = () => {
    if (campaign?.images && Array.isArray(campaign.images) && campaign.images.length > 0) {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === campaign.images.length - 1 ? 0 : prevIndex + 1
      );
    }
  };
  
  const prevImage = () => {
    if (campaign?.images && Array.isArray(campaign.images) && campaign.images.length > 0) {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === 0 ? campaign.images.length - 1 : prevIndex - 1
      );
    }
  };
  
  // Reset current image index when campaign changes
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [campaign]);
  
  // Format currency
  const formatCurrency = (amount, currency = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  // Calculate days remaining
  const getDaysRemaining = () => {
    if (!campaign?.deadline) return 'No deadline';
    
    const now = new Date();
    const deadline = new Date(campaign.deadline);
    const diffTime = deadline - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) return 'Expired';
    return `${diffDays} days left`;
  };
  
  // Calculate progress percentage
  const getProgressPercentage = () => {
    if (!campaign?.targetAmount || campaign.targetAmount === 0) return 0;
    const percentage = (campaign.currentAmount / campaign.targetAmount) * 100;
    return Math.min(percentage, 100);
  };
  
  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };
  
  // Handle donation submission
  const handleDonation = async (e) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please log in to make a donation');
      navigate('/login', { state: { from: `/campaigns/${id}` } });
      return;
    }
    
    const amount = parseFloat(donationAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid donation amount');
      return;
    }
    
    try {
      setLoadingDonation(true);
      const donationData = {
        campaignId: id,
        amount,
        currency: campaign?.currency || 'USD',
        message: donationMessage,
        isAnonymous: isAnonymous
      };
      
      // Create donation record using proper API method
      const donationResponse = await donationsAPI.createDonation(donationData);
      
      // Process payment with Stripe
      const response = await stripeService.createPaymentIntent(
        amount,
        id,
        isAnonymous,
        user?.email
      );
      
      const clientSecret = response.data?.clientSecret;
      
      if (!clientSecret) {
        throw new Error('Failed to create payment intent');
      }
      
      // Redirect to payment processing page
      navigate(`/payment/process`, {
        state: {
          clientSecret,
          amount,
          campaignId: id,
          donationId: donationResponse.data._id || donationResponse.data.id,
          campaignTitle: campaign?.title || 'Campaign'
        }
      });
      
      // Reset form after successful setup
      setDonationAmount('');
      setDonationMessage('');
      setIsAnonymous(false);
      
      return; // Exit early as we're redirecting to payment page
      
    } catch (error) {
      console.error('Donation error:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to process donation');
    } finally {
      setLoadingDonation(false);
      
      // Only refresh data if we didn't redirect to payment page
      if (!error) return;
      
      // Refresh campaign data and donations after donation attempt
      try {
        const response = await campaignsAPI.getCampaign(id);
        setCampaign(response.data.data?.campaign || response.data);
        
        const donationsResponse = await donationsAPI.getCampaignDonations(id, { limit: 5 });
        setRecentDonations(donationsResponse.data?.donations || donationsResponse.data || []);
      } catch (err) {
        console.error('Error refreshing data:', err);
      }
    }
  };
  
  // Handle comment submission
  const handleComment = async (e) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please log in to leave a comment');
      navigate('/login', { state: { from: `/campaigns/${id}` } });
      return;
    }
    
    if (!commentText.trim()) {
      toast.error('Please enter a comment');
      return;
    }
    
    try {
      const commentData = {
        campaignId: id,
        content: commentText
      };
      
      const response = await commentsAPI.createComment(commentData);
      setComments([response.data, ...comments]);
      setCommentText('');
      toast.success('Comment posted successfully!');
    } catch (err) {
      console.error('Error posting comment:', err);
      toast.error(err.message || 'Failed to post comment');
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-xl flex flex-col items-center">
          <div className="loader mb-4"></div>
          <p className="text-gray-700 font-medium">Loading campaign details...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <FaExclamationTriangle className="mx-auto h-12 w-12 text-warning-500 mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Error Loading Campaign
            </h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link to="/campaigns" className="btn-primary">
              Browse Other Campaigns
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  if (!campaign) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Campaign Not Found
            </h1>
            <p className="text-gray-600 mb-6">The campaign you're looking for doesn't exist or has been removed.</p>
            <Link to="/campaigns" className="btn-primary">
              Browse Campaigns
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-6 md:py-8">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        {/* Campaign Header */}
        <div className="mb-4 sm:mb-6 md:mb-8">
          <Link to="/campaigns" className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-2 sm:mb-3 md:mb-4 text-sm sm:text-base">
            <FaChevronLeft className="mr-1" />
            Back to Campaigns
          </Link>
          
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
            {campaign.title}
          </h1>
          
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 md:gap-4 text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">
            {campaign.category && (
              <span className={`badge category-${campaign.category}`}>
                {campaign.category.charAt(0).toUpperCase() + campaign.category.slice(1)}
              </span>
            )}
            
            {campaign.location && campaign.location.city && (
              <span className="flex items-center">
                <FaMapMarkerAlt className="mr-1" />
                {`${campaign.location.city}, ${campaign.location.country}`}
              </span>
            )}
            
            <span className="flex items-center">
              <FaRegClock className="mr-1" />
              {getDaysRemaining()}
            </span>
            
            {campaign.isVerified && (
              <span className="badge badge-success">
                Verified
              </span>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 order-2 lg:order-1">
            {/* Campaign Images */}
            <div className="card mb-4 sm:mb-6 md:mb-8">
              <div className="relative aspect-video overflow-hidden">
                {campaign?.images && Array.isArray(campaign.images) && campaign.images.length > 0 ? (
                  <>
                    <img 
                      src={campaign.images[currentImageIndex].url || campaign.images[currentImageIndex]} 
                      alt={campaign.images[currentImageIndex].caption || campaign.title} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/placeholder-campaign.svg';
                      }}
                    />
                    
                    {campaign?.images && Array.isArray(campaign.images) && campaign.images.length > 1 && (
                      <>
                        <button 
                          onClick={prevImage}
                          className="absolute left-2 top-1/2 transform -translate-y-1/2 p-2 rounded-full bg-black/30 text-white hover:bg-black/50 focus:outline-none"
                        >
                          <FaChevronLeft />
                        </button>
                        <button 
                          onClick={nextImage}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-full bg-black/30 text-white hover:bg-black/50 focus:outline-none"
                        >
                          <FaChevronRight />
                        </button>
                        
                        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
                          {campaign?.images && Array.isArray(campaign.images) && campaign.images.map((_, index) => (
                            <button 
                              key={index}
                              onClick={() => setCurrentImageIndex(index)}
                              className={`w-2 h-2 rounded-full ${index === currentImageIndex ? 'bg-white' : 'bg-white/50'}`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-400">No images available</span>
                  </div>
                )}
              </div>
              
              {campaign?.images && Array.isArray(campaign.images) && campaign.images.length > 0 && campaign.images[currentImageIndex]?.caption && (
                <div className="p-2 text-sm text-gray-500 italic text-center">
                  {campaign.images[currentImageIndex].caption}
                </div>
              )}
            </div>
            
            {/* Campaign Tabs */}
            <Tab.Group>
              <Tab.List className="flex border-b mb-4 sm:mb-6 overflow-x-auto">
                <Tab className={({ selected }) => 
                  `py-2 sm:py-3 px-3 sm:px-4 md:px-6 text-xs sm:text-sm font-medium border-b-2 whitespace-nowrap ${selected ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`
                }>
                  Story
                </Tab>
                <Tab className={({ selected }) => 
                  `py-3 px-6 text-sm font-medium border-b-2 ${selected ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`
                }>
                  Updates
                </Tab>
                <Tab className={({ selected }) => 
                  `py-3 px-6 text-sm font-medium border-b-2 ${selected ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`
                }>
                  FAQ
                </Tab>
                <Tab className={({ selected }) => 
                  `py-3 px-6 text-sm font-medium border-b-2 ${selected ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`
                }>
                  Comments
                </Tab>
              </Tab.List>
              
              <Tab.Panels>
                {/* Story Panel */}
                <Tab.Panel>
                  <div className="prose prose-sm sm:prose md:prose-lg max-w-none">
                    <div dangerouslySetInnerHTML={{ __html: campaign.story }} />
                  </div>
                  
                  {campaign.tags && campaign.tags.length > 0 && (
                    <div className="mt-4 sm:mt-6 md:mt-8">
                      <h3 className="text-lg font-semibold mb-2">Tags</h3>
                      <div className="flex flex-wrap gap-2">
                        {campaign.tags.map((tag, index) => (
                          <span key={index} className="badge badge-secondary flex items-center">
                            <FaTag className="mr-1" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </Tab.Panel>
                
                {/* Updates Panel */}
                <Tab.Panel>
                  {campaign.updates && campaign.updates.length > 0 ? (
                    <div className="space-y-3 sm:space-y-4 md:space-y-6">
                      {campaign.updates.map((update, index) => (
                        <div key={index} className="card">
                          <div className="card-header">
                            <h3 className="font-semibold">{update.title}</h3>
                            <p className="text-sm text-gray-500">{formatDate(update.createdAt)}</p>
                          </div>
                          <div className="card-body prose">
                            <div dangerouslySetInnerHTML={{ __html: update.content }} />
                            
                            {update.images && update.images.length > 0 && (
                              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {update.images.map((image, imgIndex) => (
                                  <img 
                                    key={imgIndex}
                                    src={image.url}
                                    alt={`Update ${index + 1} image ${imgIndex + 1}`}
                                    className="rounded-md"
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 sm:py-8 md:py-12">
                      <FaRegNewspaper className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Updates Yet</h3>
                      <p className="text-gray-500">The campaign creator hasn't posted any updates yet.</p>
                    </div>
                  )}
                </Tab.Panel>
                
                {/* FAQ Panel */}
                <Tab.Panel>
                  {campaign.faqs && campaign.faqs.length > 0 ? (
                    <div className="space-y-2 sm:space-y-3 md:space-y-4">
                      {campaign.faqs.map((faq, index) => (
                        <div key={index} className="card">
                          <div className="card-body p-3 sm:p-4 md:p-6">
                            <h3 className="flex items-start">
                              <FaRegQuestionCircle className="text-primary-500 mt-1 mr-2 flex-shrink-0" />
                              <span className="font-semibold">{faq.question}</span>
                            </h3>
                            <div className="mt-2 pl-7">
                              <p className="text-gray-600">{faq.answer}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <FaRegLightbulb className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No FAQs Available</h3>
                      <p className="text-gray-500">The campaign creator hasn't added any frequently asked questions yet.</p>
                    </div>
                  )}
                </Tab.Panel>
                
                {/* Comments Panel */}
                <Tab.Panel>
                  {campaign.settings?.allowComments ? (
                    <div>
                      {/* Comment Form */}
                      <div className="card mb-6">
                        <div className="card-body">
                          <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Leave a Comment</h3>
                          <form onSubmit={handleComment}>
                            <textarea
                              value={commentText}
                              onChange={(e) => setCommentText(e.target.value)}
                              className="input mb-3"
                              rows="3"
                              placeholder="Share your thoughts or ask a question..."
                              required
                            />
                            <button type="submit" className="btn-primary">
                              Post Comment
                            </button>
                          </form>
                        </div>
                      </div>
                      
                      {/* Comments List */}
                      {comments.length > 0 ? (
                        <div className="space-y-2 sm:space-y-3 md:space-y-4">
                          {comments.map((comment) => (
                            <div key={comment._id} className="card">
                              <div className="card-body">
                                <div className="flex justify-between items-start mb-2">
                                  <div className="flex items-center">
                                    <div className="font-semibold">{comment.user?.name || 'Anonymous'}</div>
                                    <span className="text-xs text-gray-500 ml-2">{formatDate(comment.createdAt)}</span>
                                  </div>
                                </div>
                                <p className="text-gray-700">{comment.content}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4 sm:py-6 md:py-8">
                          <FaRegComment className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No Comments Yet</h3>
                          <p className="text-gray-500">Be the first to share your thoughts on this campaign!</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <FaRegComment className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Comments Disabled</h3>
                      <p className="text-gray-500">The campaign creator has disabled comments for this campaign.</p>
                    </div>
                  )}
                </Tab.Panel>
              </Tab.Panels>
            </Tab.Group>
          </div>
          
          {/* Sidebar */}
          <div className="lg:col-span-1 order-1 lg:order-2 mb-4 lg:mb-0">
            {/* Campaign Progress */}
            <div className="card mb-6">
              <div className="card-body">
                <div className="mb-4">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end mb-1">
                    <span className="text-xl sm:text-2xl font-bold text-gray-900">
                      {formatCurrency(campaign.currentAmount, campaign.currency)}
                    </span>
                    <span className="text-gray-500">
                      of {formatCurrency(campaign.targetAmount, campaign.currency)}
                    </span>
                  </div>
                  
                  <div className="progress mb-1">
                    <div 
                      className="progress-bar" 
                      style={{ width: `${getProgressPercentage()}%` }}
                    ></div>
                  </div>
                  
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>{getProgressPercentage().toFixed(0)}% funded</span>
                    <span>{campaign.socialProof?.donorCount || 0} donors</span>
                  </div>
                </div>
                
                <div className="flex items-center text-sm text-gray-500 mb-6">
                  <FaRegClock className="mr-1" />
                  <span>{getDaysRemaining()}</span>
                </div>
                
                {/* Donation Form */}
                <form onSubmit={handleDonation}>
                  <div className="mb-3 sm:mb-4">
                    <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                      Donation Amount ({campaign.currency})
                    </label>
                    <input
                      type="number"
                      id="amount"
                      value={donationAmount}
                      onChange={(e) => setDonationAmount(e.target.value)}
                      className="input"
                      placeholder="Enter amount"
                      min="1"
                      required
                    />
                  </div>
                  
                  {/* QR Code Button */}
                  <div className="mb-3 sm:mb-4">
                    <button
                      type="button"
                      onClick={() => {
                        if (!donationAmount || isNaN(parseFloat(donationAmount)) || parseFloat(donationAmount) <= 0) {
                          toast.error('Please enter a valid donation amount');
                          return;
                        }
                        setQrCodeAmount(donationAmount);
                        setShowQRCode(true);
                      }}
                      className="flex items-center justify-center w-full py-2 px-4 border border-primary-300 text-primary-700 rounded-md hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 mb-2"
                    >
                      <FaQrcode className="mr-2" />
                      {campaign.upiId ? 'Pay with UPI QR Code' : 'Pay with QR Code'}
                    </button>
                    
                    {campaign.upiId && (
                      <div className="text-center text-xs text-gray-500 mb-2">
                        <span>UPI ID: </span>
                        <span className="font-medium">{campaign.upiId}</span>
                        <button 
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(campaign.upiId);
                            toast.success('UPI ID copied to clipboard!');
                          }}
                          className="text-primary-700 hover:text-primary-800 ml-1"
                          title="Copy UPI ID"
                        >
                          <FaCopy size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {/* QR Code Modal */}
                  {showQRCode && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                      <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-medium">Scan to Donate</h3>
                          <button 
                            onClick={() => setShowQRCode(false)}
                            className="text-gray-400 hover:text-gray-500"
                          >
                            &times;
                          </button>
                        </div>
                        <div className="flex flex-col items-center">
                          <div className="bg-white p-3 rounded-lg shadow-sm mb-4">
                            {campaign?.qrCode?.qrCodeImage ? (
                              // Use real QR code image from backend
                              <img 
                                src={campaign.qrCode.qrCodeImage} 
                                alt="Campaign QR Code"
                                className="w-48 h-48 object-contain"
                              />
                            ) : campaign?.paymentDetails?.qrCodeImage ? (
                              // Use QR code from payment details
                              <img 
                                src={campaign.paymentDetails.qrCodeImage} 
                                alt="Campaign Payment QR Code"
                                className="w-48 h-48 object-contain"
                              />
                            ) : campaign?.paymentDetails?.upiId || campaign?.upiId ? (
                              // Generate UPI QR code as fallback
                              <QRCodeSVG 
                                value={`upi://pay?pa=${campaign.paymentDetails?.upiId || campaign.upiId}&pn=${encodeURIComponent(campaign.creator?.name || 'Campaign Creator')}&am=${qrCodeAmount}&cu=${campaign?.currency === 'INR' ? 'INR' : 'USD'}&tn=${encodeURIComponent(`Donation for ${campaign?.title || 'Campaign'}`)}`}
                                size={200}
                                level="H"
                                includeMargin={true}
                                imageSettings={{
                                  src: '/Dreamlift Logo.png',
                                  excavate: true,
                                  width: 40,
                                  height: 40,
                                }}
                              />
                            ) : (
                              // Fallback to payment page QR code
                              <QRCodeSVG 
                                value={campaign?.qrCode?.paymentUrl || `${window.location.origin}/payment/qrcode?campaign=${id}&amount=${qrCodeAmount}&title=${encodeURIComponent(campaign?.title || 'Campaign')}`}
                                size={200}
                                level="H"
                                includeMargin={true}
                                imageSettings={{
                                  src: '/Dreamlift Logo.png',
                                  excavate: true,
                                  width: 40,
                                  height: 40,
                                }}
                              />
                            )}
                          </div>
                          <p className="text-center text-sm text-gray-600 mb-2">
                            Scan this QR code to donate {formatCurrency(qrCodeAmount, campaign.currency)} to this campaign
                          </p>
                          <p className="text-center text-xs text-gray-500">
                            {campaign?.paymentDetails?.upiId || campaign?.upiId ? 'Direct UPI payment to campaign creator' : 'You will be redirected to a secure payment page'}
                          </p>
                          {(campaign?.paymentDetails?.upiId || campaign?.upiId) && (
                             <div className="mt-2 p-2 bg-blue-50 rounded-md w-full">
                               <div className="flex items-center justify-center">
                                 <p className="text-center text-xs font-medium text-blue-700 mr-2">
                                   UPI ID: {campaign.paymentDetails?.upiId || campaign.upiId}
                                 </p>
                                 <button 
                                   type="button"
                                   onClick={() => {
                                     navigator.clipboard.writeText(campaign.upiId);
                                     toast.success('UPI ID copied to clipboard!');
                                   }}
                                   className="text-blue-700 hover:text-blue-800"
                                   title="Copy UPI ID"
                                 >
                                   <FaCopy size={12} />
                                 </button>
                               </div>
                               <div className="mt-2 text-center">
                                 <p className="text-xs text-gray-600">You can also manually enter this UPI ID in your payment app</p>
                               </div>
                              </div>
                            )}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="mb-3 sm:mb-4">
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                      Message (Optional)
                    </label>
                    <textarea
                      id="message"
                      value={donationMessage}
                      onChange={(e) => setDonationMessage(e.target.value)}
                      className="input"
                      rows="3"
                      placeholder="Add a message of support"
                    />
                  </div>
                  
                  <div className="mb-4 sm:mb-6">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={isAnonymous}
                        onChange={(e) => setIsAnonymous(e.target.checked)}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Make my donation anonymous</span>
                    </label>
                  </div>
                  
                  <button 
                    type="submit" 
                    className="btn-primary w-full py-2 sm:py-3 text-sm sm:text-base font-medium"
                    disabled={loadingDonation}
                  >
                    {loadingDonation ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Processing...
                      </>
                    ) : (
                      'Donate Now with Card'
                    )}
                  </button>
                </form>
                
                {/* Social Sharing */}
                <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
                  <h3 className="text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3">Share this campaign</h3>
                  <div className="flex space-x-2">
                    <button className="btn-outline flex-1 flex items-center justify-center">
                      <FaShare className="mr-2" />
                      Share
                    </button>
                    <button className="btn-ghost flex items-center justify-center p-2">
                      <FaRegBookmark />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Campaign Creator */}
            <div className="card mb-6">
              <div className="card-body">
                <h3 className="text-lg font-semibold mb-4">About the Creator</h3>
                <div className="flex items-center mb-3 sm:mb-4">
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                    {campaign.creator?.avatar ? (
                      <img 
                        src={campaign.creator.avatar?.url || campaign.creator.avatar} 
                        alt={campaign.creator.name} 
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-gray-400">👤</span>
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium">{campaign.creator?.name || 'Unknown'}</h4>
                    <p className="text-sm text-gray-500">{campaign.creator?.campaigns || 0} campaigns</p>
                  </div>
                </div>
                {campaign.creator?.bio && (
                  <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">{campaign.creator.bio}</p>
                )}
                <Link to={`/profile/${campaign.creator?._id}`} className="btn-outline w-full text-center">
                  View Profile
                </Link>
              </div>
            </div>
            
            {/* Recent Donations */}
            <div className="card">
              <div className="card-header">
                <h3 className="text-base sm:text-lg font-semibold">Recent Donations</h3>
              </div>
              <div className="card-body">
                {recentDonations && recentDonations.length > 0 ? (
                  <div className="space-y-4">
                    {recentDonations.map((donation) => (
                      <div key={donation._id} className="border-b border-gray-100 pb-2 sm:pb-3 md:pb-4 last:border-0 last:pb-0">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-1">
                          <span className="font-medium">
                            {donation.anonymous ? 'Anonymous' : (donation.donor?.name || 'Unknown')}
                          </span>
                          <span className="font-semibold text-gray-900">
                            {formatCurrency(donation.amount, donation.currency)}
                          </span>
                        </div>
                        {donation.message && (
                          <p className="text-xs sm:text-sm text-gray-600 italic">"{donation.message}"</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">{formatDate(donation.createdAt)}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-3 sm:py-4 md:py-6">
                    <FaRegMoneyBillAlt className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                    <p className="text-gray-500 text-xs sm:text-sm">No donations yet. Be the first to donate!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignDetail;
