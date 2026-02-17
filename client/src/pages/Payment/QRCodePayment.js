import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import toast from 'react-hot-toast';
import { FaArrowLeft, FaCreditCard, FaLock, FaQrcode } from 'react-icons/fa';

import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';
import axios from '../../axios';
import { checkSecureContext, getDevStripeWarning } from '../../utils/stripeUtils';

// Initialize Stripe
// Check if we're in a secure context (HTTPS)
checkSecureContext();

// Show development warning if applicable
const devWarning = getDevStripeWarning();
if (devWarning) {
  console.info(devWarning);
}

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || 'pk_test_TYooMQauvdEDq54NiTphI7jx');

// Payment form component
const QRPaymentForm = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const stripe = useStripe();
  const elements = useElements();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [succeeded, setSucceeded] = useState(false);
  const [campaignData, setCampaignData] = useState(null);
  const [clientSecret, setClientSecret] = useState('');
  
  // Parse query parameters
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const campaignId = queryParams.get('campaign');
    const amount = queryParams.get('amount');
    const title = queryParams.get('title');
    const success = queryParams.get('success');
    
    // Check if this is a success redirect
    if (success === 'true') {
      setSucceeded(true);
      toast.success('Payment received successfully!');
      // Update campaign progress
      axios.get(`/api/campaigns/${campaignId}`)
        .then(() => {
          console.log('Campaign data refreshed');
        })
        .catch(err => console.error('Error refreshing campaign:', err));
      return;
    }
    
    if (!campaignId || !amount) {
      toast.error('Missing payment information');
      navigate('/campaigns');
      return;
    }
    
    setCampaignData({
      campaignId,
      amount: parseFloat(amount),
      title: title || 'Campaign Donation'
    });

    // Create payment intent using the same flow as card donations
    const createPaymentIntent = async () => {
      setLoading(true);
      try {
        // First create donation record
        const donationData = {
          campaignId,
          amount: parseFloat(amount),
          currency: 'USD',
          message: '',
          isAnonymous: false
        };
        
        const donationResponse = await axios.post('/api/donations', donationData);
        
        // Then create payment intent with donation ID
        const response = await axios.post('/api/payments/stripe/create-intent', {
          amount: parseFloat(amount),
          campaignId,
          donationId: donationResponse.data._id || donationResponse.data.id,
          donorEmail: user?.email || 'anonymous@example.com'
        });
        
        if (response.data && response.data.clientSecret) {
          setClientSecret(response.data.clientSecret);
          // Store donation ID for later use
          setCampaignData(prev => ({
            ...prev,
            donationId: donationResponse.data._id || donationResponse.data.id
          }));
        } else {
          throw new Error('Invalid response from payment service');
        }
      } catch (err) {
        console.error('Error creating payment intent:', err);
        setError('Failed to initialize payment. Please try again.');
        toast.error('Payment initialization failed');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      createPaymentIntent();
    } else {
      // If not logged in, prompt to login first
      toast.error('Please log in to complete your donation');
      navigate('/login', { 
        state: { 
          from: location.pathname + location.search,
          message: 'Please log in to complete your donation'
        } 
      });
    }
  }, [location, navigate, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      // Stripe.js has not loaded yet
      return;
    }
    
    if (!clientSecret) {
      setError('Payment information is missing');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Confirm card payment
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: {
            name: user?.name || 'Anonymous Donor',
            email: user?.email
          }
        }
      });
      
      if (error) {
        setError(error.message);
        // Update donation status to failed if we have donation ID
        if (campaignData.donationId) {
          try {
            await axios.patch(`/api/donations/${campaignData.donationId}/status`, { status: 'failed' });
          } catch (updateErr) {
            console.error('Failed to update donation status:', updateErr);
          }
        }
      } else if (paymentIntent.status === 'succeeded') {
        setSucceeded(true);
        toast.success('Payment successful!');
        
        // Update donation status to completed if we have donation ID
        if (campaignData.donationId) {
          try {
            await axios.patch(`/api/donations/${campaignData.donationId}/status`, { status: 'completed' });
          } catch (updateErr) {
            console.error('Failed to update donation status:', updateErr);
          }
        }
        
        // Dispatch payment success event to hide QR code
        window.dispatchEvent(new CustomEvent('paymentSuccess', { 
          detail: { campaignId: campaignData.campaignId } 
        }));
        
        // Also set localStorage flag for cross-tab communication
        localStorage.setItem('paymentSuccess', Date.now().toString());
        
        // Redirect after a short delay
        setTimeout(() => {
          navigate(`/campaigns/${campaignData.campaignId}`, { replace: true });
        }, 1500); // Reduced delay for faster redirection
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !clientSecret) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <LoadingSpinner size="large" />
        <p className="mt-4 text-gray-600">Preparing QR payment...</p>
      </div>
    );
  }

  // Show payment success screen
  if (succeeded) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
        <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
          <div className="flex flex-col items-center mb-6">
            <div className="flex items-center justify-center w-16 h-16 mb-4 bg-green-100 rounded-full">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Payment Received!</h2>
            <p className="mt-2 text-center text-gray-600">
              Thank you for your donation to {campaignData?.title}
            </p>
          </div>
          
          <div className="p-4 mb-6 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Amount:</span>
              <span className="font-medium text-gray-800">${campaignData?.amount?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span className="font-medium text-green-600">Completed</span>
            </div>
          </div>
          
          <button
            onClick={() => navigate(`/campaigns/${campaignData?.campaignId}`)}
            className="w-full py-3 font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Return to Campaign
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
        <div className="flex items-center mb-6">
          <button 
            onClick={() => navigate(-1)} 
            className="mr-2 text-gray-600 hover:text-gray-800"
          >
            <FaArrowLeft />
          </button>
          <h2 className="text-2xl font-bold text-gray-800">QR Code Payment</h2>
        </div>
        
        {error && (
          <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
            {error}
          </div>
        )}
        
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            <span className="text-gray-600">Campaign:</span>
            <span className="font-medium text-gray-800">{campaignData?.title}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Amount:</span>
            <span className="font-medium text-gray-800">${campaignData?.amount?.toFixed(2)}</span>
          </div>
        </div>
        
        <div className="p-4 mb-6 border border-gray-200 rounded-lg">
          <div className="flex items-center justify-center mb-4">
            <FaQrcode className="mr-2 text-blue-500" />
            <h3 className="text-lg font-medium text-gray-800">Scan QR Code to Pay</h3>
          </div>
          
          <div className="flex items-center justify-center p-4 bg-gray-100 rounded-lg">
            {clientSecret ? (
              <CardElement
                options={{
                  style: {
                    base: {
                      fontSize: '16px',
                      color: '#424770',
                      '::placeholder': {
                        color: '#aab7c4',
                      },
                    },
                    invalid: {
                      color: '#9e2146',
                    },
                  },
                }}
              />
            ) : (
              <LoadingSpinner />
            )}
          </div>
        </div>
        
        <button
          disabled={loading || !stripe || !clientSecret}
          onClick={handleSubmit}
          className="w-full py-3 font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Pay Now'}
        </button>
        
        <div className="flex items-center justify-center mt-4 text-sm text-gray-500">
          <FaLock className="mr-1" />
          <span>Secure payment powered by Stripe</span>
        </div>
      </div>
    </div>
  );
};

// Wrap with Stripe Elements
const QRCodePayment = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-md mx-auto">
        <Elements stripe={stripePromise}>
          <QRPaymentForm />
        </Elements>
      </div>
    </div>
  );
};

export default QRCodePayment;