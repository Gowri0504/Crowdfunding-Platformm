// client/src/services/api.js
import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  timeout: 30000, // Increased to 30 seconds for file uploads
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Fix for [object Module] issue in URLs
api.interceptors.request.use(config => {
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

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add request timestamp for debugging
    config.metadata = { startTime: new Date() };
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Log response time for debugging
    const endTime = new Date();
    const startTime = response.config.metadata?.startTime;
    if (startTime) {
      const duration = endTime.getTime() - startTime.getTime();
      console.log(`API Request: ${response.config.method?.toUpperCase()} ${response.config.url} - ${duration}ms`);
    }
    
    return response;
  },
  (error) => {
    // Handle common errors
    if (error.response) {
      const { status, data } = error.response;
      
      // Handle 401 Unauthorized
      if (status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        return Promise.reject(new Error('Session expired. Please login again.'));
      }
      
      // Handle 403 Forbidden
      if (status === 403) {
        return Promise.reject(new Error('You do not have permission to perform this action.'));
      }
      
      // Handle 404 Not Found
      if (status === 404) {
        return Promise.reject(new Error('Resource not found.'));
      }
      
      // Handle 422 Validation Error
      if (status === 422) {
        const validationErrors = data.errors || {};
        const errorMessage = Object.values(validationErrors).flat().join(', ');
        return Promise.reject(new Error(errorMessage || 'Validation failed.'));
      }
      
      // Handle 429 Rate Limit
      if (status === 429) {
        return Promise.reject(new Error('Too many requests. Please try again later.'));
      }
      
      // Handle 500 Server Error
      if (status >= 500) {
        return Promise.reject(new Error('Server error. Please try again later.'));
      }
      
      // Return the error message from the server
      return Promise.reject(new Error(data.message || 'An error occurred.'));
    }
    
    // Handle network errors
    if (error.code === 'ECONNABORTED') {
      return Promise.reject(new Error('Request timeout. Please check your connection.'));
    }
    
    if (!error.response) {
      return Promise.reject(new Error('Network error. Please check your connection.'));
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  // Login
  login: (credentials) => api.post('/api/auth/login', credentials),
  
  // Register
  register: (userData) => api.post('/api/auth/register', userData),
  
  // Get current user
  getMe: () => api.get('/api/auth/me'),
  
  // Update profile
  updateProfile: (profileData) => api.put('/api/auth/profile', profileData),
  
  
  // Logout
  logout: () => api.post('/api/auth/logout'),
};

// Campaigns API
export const campaignsAPI = {
  // Get all campaigns
  getCampaigns: (params) => api.get('/api/campaigns', { params }),
  
  // Get single campaign
  getCampaign: (id) => api.get(`/api/campaigns/${id}`),
  
  // Create campaign
  createCampaign: (campaignData) => api.post('/api/campaigns', campaignData),
  
  // Update campaign
  updateCampaign: (id, campaignData) => api.put(`/api/campaigns/${id}`, campaignData),
  
  // Delete campaign
  deleteCampaign: (id) => api.delete(`/api/campaigns/${id}`),
  
  // Upload campaign images
  uploadImages: (id, formData) => api.post(`/api/campaigns/${id}/images`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  
  // Delete campaign image
  deleteImage: (id, imageId) => api.delete(`/api/campaigns/${id}/images/${imageId}`),
  
  // Add campaign update
  addUpdate: (id, updateData) => api.post(`/api/campaigns/${id}/updates`, updateData),
  
  // Add campaign FAQ
  addFAQ: (id, faqData) => api.post(`/api/campaigns/${id}/faqs`, faqData),
  
  // Get trending campaigns
  getTrending: (limit) => api.get('/api/campaigns/trending', { params: { limit } }),
  
  // Get campaigns by category
  getByCategory: (category, params) => api.get(`/api/campaigns/category/${category}`, { params }),
  
  // Search campaigns
  search: (query, params) => api.get('/api/campaigns/search', { params: { q: query, ...params } }),
  
  // Get user campaigns
  getUserCampaigns: (userId, params) => api.get(`/api/campaigns/user/${userId}`, { params }),
  
  // Get campaign analytics
  getAnalytics: (id) => api.get(`/api/campaigns/${id}/analytics`),
};

// Donations API
export const donationsAPI = {
  // Create donation
  createDonation: (donationData) => api.post('/api/donations', donationData),
  
  // Get donation
  getDonation: (id) => api.get(`/api/donations/${id}`),
  
  // Get user donations
  getUserDonations: (params) => api.get('/api/donations/user', { params }),
  
  // Get campaign donations
  getCampaignDonations: (campaignId, params) => api.get(`/api/donations/campaign/${campaignId}`, { params }),
  
  // Request refund
  requestRefund: (id, reason) => api.post(`/api/donations/${id}/refund`, { reason }),
  
  // Get donation receipt
  getReceipt: (id) => api.get(`/api/donations/${id}/receipt`),
};

// Comments API
export const commentsAPI = {
  // Get campaign comments
  getComments: (campaignId, params) => api.get(`/api/comments/campaign/${campaignId}`, { params }),
  
  // Create comment
  createComment: (commentData) => api.post('/api/comments', commentData),
  
  // Update comment
  updateComment: (id, commentData) => api.put(`/api/comments/${id}`, commentData),
  
  // Delete comment
  deleteComment: (id) => api.delete(`/api/comments/${id}`),
  
  // Like comment
  likeComment: (id) => api.post(`/api/comments/${id}/like`),
  
  // Unlike comment
  unlikeComment: (id) => api.delete(`/api/comments/${id}/like`),
  
  // Flag comment
  flagComment: (id, reason) => api.post(`/api/comments/${id}/flag`, { reason }),
};

// Notifications API
export const notificationsAPI = {
  // Get notifications
  getNotifications: (params) => api.get('/api/notifications', { params }),
  
  // Mark as read
  markAsRead: (id) => api.put(`/api/notifications/${id}/read`),
  
  // Mark all as read
  markAllAsRead: () => api.put('/api/notifications/read-all'),
  
  // Get unread count
  getUnreadCount: () => api.get('/api/notifications/unread-count'),
};

// Upload API
export const uploadAPI = {
  // Upload file
  uploadFile: (file, type = 'general') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    
    return api.post('/api/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  
  // Upload multiple files
  uploadFiles: (files, type = 'general') => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    formData.append('type', type);
    
    return api.post('/api/upload/multiple', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  
  // Delete file
  deleteFile: (publicId) => api.delete(`/api/upload/${publicId}`),
};

// Health check
export const healthAPI = {
  check: () => api.get('/api/health'),
};

export default api;
