// Utility functions for Stripe integration
import toast from 'react-hot-toast';

/**
 * Checks if the application is running in a secure context (HTTPS)
 * and displays appropriate warnings if not in production
 */
export const checkSecureContext = () => {
  if (typeof window !== 'undefined' && 
      window.location.protocol !== 'https:' && 
      process.env.NODE_ENV === 'production') {
    
    console.warn('Stripe requires HTTPS in production. Your payment form may not work correctly.');
    
    // Display a user-friendly warning toast in production
    toast.error('Secure connection required for payments. Please use HTTPS.');
    
    return false;
  }
  
  return true;
};

/**
 * Creates a development-friendly Stripe warning message
 * @returns {string} Warning message for development environment
 */
export const getDevStripeWarning = () => {
  if (process.env.NODE_ENV !== 'production') {
    return 'Using Stripe in development mode. Switch to HTTPS for production.';
  }
  return '';
};