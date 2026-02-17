import axios from 'axios';
import toast from 'react-hot-toast';

// Create axios instance
const instance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  timeout: 30000, // Increased to 30 seconds for file uploads
  withCredentials: true,
});

// Log API requests in development
if (process.env.NODE_ENV === 'development') {
  instance.interceptors.request.use(request => {
    console.log('API Request:', request.method, request.url);
    return request;
  });
}

// Fix for [object Module] issue in URLs
instance.interceptors.request.use(config => {
  if (config.url) {
    // Fix [object Module] in URLs
    if (config.url.toString().includes('[object Module]')) {
      config.url = config.url.toString().replace(/\[object Module\]/g, '');
    }
    
    // Fix [object Object] in URLs
    if (config.url.toString().includes('[object Object]')) {
      config.url = config.url.toString().replace(/\[object Object\]/g, '');
    }
    
    // Make sure URL doesn't have double slashes except for http://
    if (config.url.includes('//') && !config.url.includes('://')) {
      config.url = config.url.replace(/\/\//g, '/');
    }
  }
  return config;
});

// Request interceptor to add auth token
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    const { response } = error;

    if (response) {
      switch (response.status) {
        case 401:
          // Only redirect to login if we're not already on a public page
          if (
            !window.location.pathname.includes('/login') &&
            !window.location.pathname.includes('/register') &&
            !window.location.pathname.includes('/campaigns') &&
            !window.location.pathname === '/'
          ) {
            // Check if this is a repeated 401 error
            const lastAuthError = localStorage.getItem('lastAuthError');
            const now = new Date().getTime();
            
            if (!lastAuthError || (now - parseInt(lastAuthError)) > 60000) { // Only show once per minute
              toast.error('Session expired. Please login again.');
              localStorage.setItem('lastAuthError', now.toString());
              
              // Remove token only if we're redirecting
              localStorage.removeItem('token');
              delete instance.defaults.headers.common['Authorization'];
              window.location.href = '/login';
            }
          }
          break;

        case 403:
          toast.error("Access denied. You don't have permission to perform this action.");
          break;

        case 404:
          toast.error('Resource not found.');
          break;

        case 429:
          toast.error('Too many requests. Please try again later.');
          break;

        case 500:
        case 502:
        case 503:
        case 504:
          toast.error('Server error. Please try again later.');
          break;

        default:
          const message = response.data?.message || 'An error occurred. Please try again.';
          toast.error(message);
      }
    } else if (error.request) {
      // Network error - no response received
      toast.error('Network error. Please check your connection and try again.');
      console.error('Network error details:', error.request);
    } else if (error.message === 'Network Error') {
      toast.error('Cannot connect to server. Please try again later.');
      console.error('Network connection error:', error);
    } else {
      toast.error('An unexpected error occurred.');
      console.error('Unexpected error:', error);
    }

    return Promise.reject(error);
  }
);

export default instance;
