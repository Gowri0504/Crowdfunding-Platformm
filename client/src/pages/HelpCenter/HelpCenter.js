import React from 'react';
import { Link } from 'react-router-dom';
import { FaArrowLeft, FaQuestion, FaBook, FaHeadset, FaFileAlt, FaShieldAlt } from 'react-icons/fa';

const HelpCenter = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link to="/" className="flex items-center text-blue-600 hover:text-blue-800">
            <FaArrowLeft className="mr-2" />
            Back to Home
          </Link>
        </div>
        
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 bg-blue-600">
            <h1 className="text-3xl font-bold text-white">Help Center</h1>
            <p className="mt-1 max-w-2xl text-sm text-blue-100">Find resources and support for using our platform.</p>
          </div>
          
          <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {/* FAQ Card */}
              <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-200 hover:shadow-md transition-shadow duration-300">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                      <FaQuestion className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-5">
                      <h3 className="text-lg font-medium text-gray-900">Frequently Asked Questions</h3>
                      <p className="mt-2 text-sm text-gray-500">Find answers to common questions about our platform.</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Link to="/faq" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                      View FAQ
                      <span aria-hidden="true"> &rarr;</span>
                    </Link>
                  </div>
                </div>
              </div>
              
              {/* User Guide Card */}
              <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-200 hover:shadow-md transition-shadow duration-300">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                      <FaBook className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="ml-5">
                      <h3 className="text-lg font-medium text-gray-900">User Guide</h3>
                      <p className="mt-2 text-sm text-gray-500">Learn how to use our platform with step-by-step guides.</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <span className="text-sm font-medium text-gray-500">
                      Coming Soon
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Contact Support Card */}
              <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-200 hover:shadow-md transition-shadow duration-300">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-purple-100 rounded-md p-3">
                      <FaHeadset className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="ml-5">
                      <h3 className="text-lg font-medium text-gray-900">Contact Support</h3>
                      <p className="mt-2 text-sm text-gray-500">Need help? Our support team is here for you.</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <a href="mailto:support@example.com" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                      Email Support
                      <span aria-hidden="true"> &rarr;</span>
                    </a>
                  </div>
                </div>
              </div>
              
              {/* Terms of Service Card */}
              <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-200 hover:shadow-md transition-shadow duration-300">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
                      <FaFileAlt className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div className="ml-5">
                      <h3 className="text-lg font-medium text-gray-900">Terms of Service</h3>
                      <p className="mt-2 text-sm text-gray-500">Review our terms and conditions.</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Link to="/terms-of-service" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                      View Terms
                      <span aria-hidden="true"> &rarr;</span>
                    </Link>
                  </div>
                </div>
              </div>
              
              {/* Privacy Policy Card */}
              <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-200 hover:shadow-md transition-shadow duration-300">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-red-100 rounded-md p-3">
                      <FaShieldAlt className="h-6 w-6 text-red-600" />
                    </div>
                    <div className="ml-5">
                      <h3 className="text-lg font-medium text-gray-900">Privacy Policy</h3>
                      <p className="mt-2 text-sm text-gray-500">Learn how we protect your data.</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Link to="/privacy-policy" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                      View Policy
                      <span aria-hidden="true"> &rarr;</span>
                    </Link>
                  </div>
                </div>
              </div>
              
              {/* Donation Guide Card */}
              <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-200 hover:shadow-md transition-shadow duration-300">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-indigo-100 rounded-md p-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-5">
                      <h3 className="text-lg font-medium text-gray-900">Donation Guide</h3>
                      <p className="mt-2 text-sm text-gray-500">Learn how to make donations and support campaigns.</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <span className="text-sm font-medium text-gray-500">
                      Coming Soon
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-12 bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Common Questions</h2>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900">How do I create a campaign?</h3>
                <p className="mt-2 text-gray-600">To create a campaign, sign in to your account, go to your dashboard, and click on "Create Campaign." Fill out the required information and submit for review.</p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900">How do I make a donation?</h3>
                <p className="mt-2 text-gray-600">Browse campaigns, select one you'd like to support, click the "Donate" button, enter your donation amount, and follow the payment instructions.</p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900">How do I contact support?</h3>
                <p className="mt-2 text-gray-600">You can reach our support team by emailing <a href="mailto:support@example.com" className="text-blue-600 hover:text-blue-800">support@example.com</a> or by using the contact form on our website.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpCenter;