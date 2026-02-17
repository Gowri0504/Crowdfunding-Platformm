// client/src/services/stripeService.js
import { loadStripe } from '@stripe/stripe-js';
import api from '../axios';
import { checkSecureContext } from '../utils/stripeUtils';

// Initialize Stripe with your publishable key
// Check if we're in a secure context (HTTPS)
checkSecureContext();

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || 'pk_test_51O9VqHSIXBKwkZxuCVQPpMgOcZFMQHwhYNNAcvpPIQyAGUMY0iZlLyWwWJ3NOSGlmTmXuYy8EFwGYMlwj8wXIGBT00ORlYSj0B');

export const stripeService = {
  // Get Stripe instance
  getStripe: () => stripePromise,
  
  // Create payment intent for donation
  createPaymentIntent: async (amount, campaignId, isAnonymous = false, donorEmail = null) => {
    try {
      const response = await api.post('/api/payments/stripe/create-intent', {
        amount,
        campaignId,
        isAnonymous,
        donorEmail
      });
      return response;
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw error;
    }
  },
  
  // Process payment with card details
  processPayment: async (paymentMethodId, paymentIntentId) => {
    try {
      // Use the Stripe API directly since there's no server endpoint for this
      const stripe = await stripePromise;
      const response = await stripe.confirmCardPayment(paymentIntentId, {
        payment_method: paymentMethodId
      });
      return response;
    } catch (error) {
      console.error('Error processing payment:', error);
      throw error;
    }
  },
  
  // Confirm card payment
  confirmCardPayment: async (clientSecret, paymentMethod) => {
    try {
      const stripe = await stripePromise;
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: paymentMethod
      });
      
      return result;
    } catch (error) {
      console.error('Error confirming card payment:', error);
      throw error;
    }
  }
};

export default stripeService;