import React from 'react';
import { Link } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';

const FAQ = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Link to="/" className="flex items-center text-blue-600 hover:text-blue-800">
            <FaArrowLeft className="mr-2" />
            Back to Home
          </Link>
        </div>
        
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 bg-blue-600">
            <h1 className="text-3xl font-bold text-white">Frequently Asked Questions</h1>
            <p className="mt-1 max-w-2xl text-sm text-blue-100">Find answers to common questions about our platform.</p>
          </div>
          
          <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
            <div className="space-y-8">
              {/* General Questions */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">General Questions</h2>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">What is this crowdfunding platform about?</h3>
                    <p className="mt-2 text-gray-600">Our platform connects individuals and organizations with donors who want to support meaningful causes. We provide a secure and transparent way to raise funds for various projects, charitable causes, and personal needs.</p>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">How do I create a campaign?</h3>
                    <p className="mt-2 text-gray-600">To create a campaign, you need to sign up for an account. Once logged in, navigate to your dashboard and click on "Create Campaign." Fill out the required information, including campaign details, funding goal, and images, then submit for review.</p>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Is there a fee for using the platform?</h3>
                    <p className="mt-2 text-gray-600">We charge a small platform fee of 5% on successfully funded campaigns. This fee helps us maintain and improve the platform. There may also be payment processing fees depending on the payment method used by donors.</p>
                  </div>
                </div>
              </div>
              
              {/* Donation Questions */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Donation Questions</h2>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">How do I make a donation?</h3>
                    <p className="mt-2 text-gray-600">To make a donation, browse campaigns and select one you'd like to support. Click the "Donate" button, enter your donation amount, and follow the payment instructions. You can donate using credit/debit cards or UPI.</p>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Are donations tax-deductible?</h3>
                    <p className="mt-2 text-gray-600">Tax deductibility depends on the campaign organizer's status. Donations to registered non-profit organizations may be tax-deductible. We recommend checking with the campaign organizer or consulting a tax professional for specific advice.</p>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Can I get a refund for my donation?</h3>
                    <p className="mt-2 text-gray-600">Generally, donations are non-refundable. However, in cases of suspected fraud or if a campaign is canceled before the funds are disbursed, we may issue refunds. Please contact our support team for assistance with specific situations.</p>
                  </div>
                </div>
              </div>
              
              {/* Account Questions */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Account Questions</h2>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">How do I reset my password?</h3>
                    <p className="mt-2 text-gray-600">If you've forgotten your password, click on the "Forgot Password" link on the login page. Enter your email address, and we'll send you instructions to reset your password.</p>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">How can I update my profile information?</h3>
                    <p className="mt-2 text-gray-600">To update your profile, log in to your account and navigate to the Dashboard. Click on the "Profile" or "Account Settings" section where you can edit your personal information, change your password, and update notification preferences.</p>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Is my personal information secure?</h3>
                    <p className="mt-2 text-gray-600">Yes, we take data security seriously. We use encryption to protect your personal and payment information. We do not share your data with third parties without your consent. For more details, please review our <Link to="/privacy-policy" className="text-blue-600 hover:text-blue-800">Privacy Policy</Link>.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-8 text-center">
          <p className="text-gray-600">Can't find what you're looking for?</p>
          <Link to="/help-center" className="mt-2 inline-block text-blue-600 hover:text-blue-800 font-medium">
            Visit our Help Center
          </Link>
        </div>
      </div>
    </div>
  );
};

export default FAQ;