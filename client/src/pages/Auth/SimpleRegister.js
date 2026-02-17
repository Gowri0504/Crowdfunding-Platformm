import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from '../../axios';

const SimpleRegister = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Password validation helper function
  const validatePassword = (password) => {
    const validations = [
      { isValid: password.length >= 8, message: 'Password must be at least 8 characters long' },
      { isValid: /[A-Z]/.test(password), message: 'Password must contain at least one uppercase letter' },
      { isValid: /[a-z]/.test(password), message: 'Password must contain at least one lowercase letter' },
      { isValid: /\d/.test(password), message: 'Password must contain at least one number' }
    ];
    
    const failedValidation = validations.find(validation => !validation.isValid);
    return {
      isValid: !failedValidation,
      message: failedValidation ? failedValidation.message : ''
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if all fields are filled
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    // Check if passwords match
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    // Validate password strength
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      toast.error(passwordValidation.message);
      return;
    }

    try {
      setIsLoading(true);
      
      // Send registration request
      const response = await axios.post('/api/auth/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password
      });
      
      // Log the response for debugging
      console.log('Registration response:', response.data);
      
      if (response.data) {
        // Check for success indicators in different response formats
        const isSuccess = response.data.success || 
                         response.data.data?.token || 
                         response.data.token || 
                         response.data.status === 'success';
                         
        if (isSuccess) {
          // Handle successful registration
          toast.success('Registration successful! Please login.');
          navigate('/login', { state: { fromRegister: true } });
        } else {
          // Handle unexpected response format
          const errorMessage = response.data?.message || response.data?.error || 'Registration failed - please try again';
          toast.error(errorMessage);
        }
      } else {
        toast.error('Registration failed - no response data');
      }
    } catch (error) {
      console.error('Registration error:', error);
      
      if (error.response?.status === 500) {
        toast.error('Server error. Please try again later.');
      } else if (error.response?.status === 400) {
        // Check for different error message formats
        const errorMsg = error.response.data?.error || error.response.data?.message || 'Registration failed';
        toast.error(errorMsg);
      } else if (error.message === 'Network Error') {
        toast.error('Network error. Please check your connection and try again.');
        console.log('Server might be down or unreachable');
      } else if (error.response?.status === 400) {
        // Check for different error message formats
        const errorMsg = error.response.data?.error || error.response.data?.message || '';
        if (errorMsg.includes('already exists')) {
          toast.error('An account with this email already exists.');
        } else {
          toast.error(errorMsg || 'Registration failed. Please check your information.');
        }
      } else {
        // Handle registration errors
        const message = error.response?.data?.error || error.response?.data?.message || 'Registration failed. Please try again.';
        toast.error(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-md">
        <div className="flex flex-col items-center">
          <div className="w-24 h-24 mb-4 rounded-full bg-green-100 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
              sign in to your existing account
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              value={formData.name}
              onChange={handleChange}
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Full Name"
            />
          </div>

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
              placeholder="Password (min 8 characters)"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Confirm Password"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating account...' : 'Create account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SimpleRegister;