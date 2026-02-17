import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from '../axios';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for existing token on app load
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('token');
      
      if (token) {
        try {
          // Set the token in axios headers
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Get current user data
          const response = await axios.get('/api/auth/me');
          console.log('Auth check response:', response.data);
          
          if (response.data) {
            // Handle both response formats for backward compatibility
            const userData = response.data.data?.user || response.data.user;
            
            if (userData) {
              console.log('User authenticated:', userData);
              setUser(userData);
            } else {
              // Invalid response format
              console.error('Invalid user data format received:', response.data);
              localStorage.removeItem('token');
              delete axios.defaults.headers.common['Authorization'];
            }
          } else {
            // Invalid response format
            console.error('Invalid user data format received - empty response');
            localStorage.removeItem('token');
            delete axios.defaults.headers.common['Authorization'];
          }
        } catch (error) {
          // Token is invalid, remove it
          console.error('Token verification failed:', error.response?.status || error.message);
          
          // Only remove token if it's an authentication error (401)
          if (error.response && error.response.status === 401) {
            console.log('Removing invalid token');
            localStorage.removeItem('token');
            delete axios.defaults.headers.common['Authorization'];
          } else {
            // For other errors, keep the token but set loading to false
            console.warn('API error but keeping authentication token');
          }
        }
      } else {
        console.log('No authentication token found');
      }
      setLoading(false);
    };

    checkAuthStatus();
  }, []);

  const login = (userData, token) => {
    console.log('Login function called with:', { userData, token });
    if (token) {
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(userData);
      setLoading(false);
      console.log('User logged in successfully');
    } else {
      console.error('Login failed: No token provided');
      toast.error('Authentication failed: No token received');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const value = {
    user,
    setUser,
    loading,
    setLoading,
    isAuthenticated: !!user,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};