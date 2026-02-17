import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FaArrowLeft, FaCreditCard, FaLock } from 'react-icons/fa';

import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';
import { checkSecureContext, getDevStripeWarning } from '../../utils/stripeUtils';

// Initialize Stripe
// Check if we're in a secure context (HTTPS)
checkSecureContext();

// Show development warning if applicable
const devWarning = getDevStripeWarning();
if (devWarning) {
  console.info(devWarning);
}

// Use the test key directly to ensure it works
const stripePromise = loadStripe('pk_test_51O9VqHSIXBKwkZxuCVQPpMgOcZFMQHwhYNNAcvpPIQyAGUMY0iZlLyWwWJ3NOSGlmTmXuYy8EFwGYMlwj8wXIGBT00ORlYSj0B');

// Payment form component
const PaymentForm = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const stripe = useStripe();
  const elements = useElements();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [succeeded, setSucceeded] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  
  useEffect(() => {
    // Get payment data from location state
    if (location.state && location.state.clientSecret) {
      setPaymentData(location.state);
    } else {
      // No payment data, redirect back to campaigns
      toast.error('No payment information found');
      navigate('/campaigns');
    }
  }, [location, navigate]);
  
  // Safety check - if no clientSecret is available, redirect
  useEffect(() => {
    if (paymentData && !paymentData.clientSecret) {
      toast.error('Invalid payment information');
      navigate('/campaigns');
    }
  }, [paymentData, navigate]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      // Stripe.js has not loaded yet
      return;
    }
    
    if (!paymentData || !paymentData.clientSecret) {
      setError('Payment information is missing');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Confirm card payment
      const { error, paymentIntent } = await stripe.confirmCardPayment(paymentData.clientSecret, {
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
        // Update donation status to failed
        try {
          await axios.patch(`/api/donations/${paymentData.donationId}/status`, { status: 'failed' });
        } catch (updateErr) {
          console.error('Failed to update donation status:', updateErr);
        }
      } else if (paymentIntent.status === 'succeeded') {
        setSucceeded(true);
        toast.success('Payment successful!');
        
        // Update donation status to completed
        try {
          await axios.patch(`/api/donations/${paymentData.donationId}/status`, { status: 'completed' });
        } catch (updateErr) {
          console.error('Failed to update donation status:', updateErr);
        }
        
        // Dispatch payment success event to hide QR code
        window.dispatchEvent(new CustomEvent('paymentSuccess', { 
          detail: { campaignId: paymentData.campaignId } 
        }));
        
        // Also set localStorage flag for cross-tab communication
        localStorage.setItem('paymentSuccess', Date.now().toString());
        
        // Redirect after a short delay
        setTimeout(() => {
          navigate(`/campaigns/${paymentData.campaignId}`, { replace: true });
        }, 1500); // Reduced delay for faster redirection
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  if (!paymentData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" text="Loading payment information..." />
      </div>
    );
  }
  
  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="mb-6">
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center text-blue-600 hover:text-blue-800"
        >
          <FaArrowLeft className="mr-2" /> Back
        </button>
      </div>
      
      <h2 className="text-2xl font-bold mb-4">Complete Your Donation</h2>
      
      <div className="mb-6 p-4 bg-gray-50 rounded-md">
        <h3 className="text-lg font-medium mb-2">{paymentData.campaignTitle}</h3>
        <p className="text-gray-700 mb-2">
          Donation Amount: <span className="font-semibold">${paymentData.amount.toFixed(2)}</span>
        </p>
      </div>
      
      {succeeded ? (
        <div className="text-center p-4 bg-green-50 rounded-md">
          <h3 className="text-xl font-medium text-green-700 mb-2">Payment Successful!</h3>
          <p className="mb-4">Thank you for your generous donation.</p>
          <p>You will be redirected back to the campaign page shortly.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center mb-2">
                <FaCreditCard className="mr-2" />
                <span>Card Details</span>
              </div>
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
                className="p-3 border border-gray-300 rounded-md"
              />
            </label>
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
              {error}
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <div className="flex items-center text-sm text-gray-600">
              <FaLock className="mr-1" /> Secure payment
            </div>
            <button
              type="submit"
              disabled={!stripe || loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="small" className="mr-2" />
                  Processing...
                </>
              ) : (
                'Complete Donation'
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

// Wrap with Stripe Elements
const ProcessPayment = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-md mx-auto">
        <Elements stripe={stripePromise}>
          <PaymentForm />
        </Elements>
      </div>
    </div>
  );
};

export default ProcessPayment;