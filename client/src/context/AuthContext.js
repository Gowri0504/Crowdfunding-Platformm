import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from '../axios';

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
          // Token already added by axios interceptor
          const response = await axios.get('/api/auth/me'); // ✅ fixed path
          setUser(response.data.user);
        } catch (error) {
          console.error('Token verification failed:', error);
          
          // Only remove token if it's an authentication error, not a network error
          if (error.response && error.response.status === 401) {
            localStorage.removeItem('token');
            delete axios.defaults.headers.common['Authorization'];
            setUser(null);
          } else if (error.message === 'Network Error') {
            // For network errors, keep the token and try again later
            console.log('Network error but keeping authentication token');
            // We'll keep the user as null but won't remove the token
            setUser(null);
          } else {
            // For other errors, keep the token and try again later
            console.log('API error but keeping authentication token');
            setUser(null);
          }
        }
      }

      setLoading(false);
    };

    checkAuthStatus();
  }, []);

  // Login helper
  const login = (userData, token) => {
    localStorage.setItem('token', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(userData);
  };

  // Logout helper
  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading,
        setLoading,
        isAuthenticated: !!user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
