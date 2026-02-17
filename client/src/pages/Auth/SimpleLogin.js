import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from '../../axios';
import { useAuth } from '../../contexts/AuthContext';
import LoginSuccessPopup from '../../components/UI/LoginSuccessPopup';

const SimpleLogin = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [loginUser, setLoginUser] = useState(null);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      setIsLoading(true);
      
      // Make API call to the login endpoint
      const response = await axios.post('/api/auth/login', formData);
      
      // Log the response for debugging
      console.log('Login response:', response.data);
      
      if (response.data) {
        // Handle both response formats for backward compatibility
        const userData = response.data.data?.user || response.data.user;
        const token = response.data.data?.token || response.data.token;
        const redirectTo = response.data.data?.redirectTo || response.data.redirectTo;
        
        if (!userData || !token) {
          console.error('Invalid response format:', response.data);
          toast.error('Invalid response from server. Please try again.');
          return;
        }
        
        // Store user data for popup
        setLoginUser(userData);
        
        // Call login function to set auth state
        login(userData, token);
        
        // Check if admin login with redirect
        if (redirectTo === '/admin') {
          toast.success('Admin login successful! Redirecting to admin panel...');
          setTimeout(() => {
            navigate('/admin', { replace: true });
          }, 1000);
          return;
        }
        
        // Show success popup (navigation happens after popup closes)
        setShowSuccessPopup(true);
      } else {
        const errorMessage = response.data?.message || 'Login failed - please try again';
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Login error:', error);
      
      if (error.response?.status === 500) {
        toast.error('Server error. Please try again later.');
      } else if (error.response?.status === 401) {
        toast.error('Invalid email or password');
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error.message === 'Network Error') {
        toast.error('Network error. Please check your connection and try again.');
        console.log('Server might be down or unreachable');
      } else {
        const message = error.response?.data?.error || error.response?.data?.message || 'Login failed. Please try again.';
        toast.error(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePopupComplete = () => {
    setShowSuccessPopup(false);
    // Redirect to dashboard after login
    navigate('/dashboard', { replace: true });
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-md">
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 mb-4 rounded-full bg-blue-100 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900">
              Sign in to your account
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Or{' '}
              <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
                create a new account
              </Link>
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Email address"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Password"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>
        </div>
      </div>
      <LoginSuccessPopup 
        show={showSuccessPopup}
        user={loginUser}
        onComplete={handlePopupComplete}
      />
    </>
  );
};

export default SimpleLogin;