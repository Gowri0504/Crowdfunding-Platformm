import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FaShieldAlt, FaUserShield, FaLock, FaGlobe, FaCookieBite, FaEnvelope } from 'react-icons/fa';

const Privacy = () => {
  // Scroll to top on component mount
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="py-12 sm:py-16 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Privacy Policy
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 mb-6">
              How we collect, use, and protect your information
            </p>
            <div className="flex items-center justify-center">
              <FaLock className="text-blue-600 text-2xl sm:text-3xl mr-2" />
              <p className="text-sm text-gray-500">
                Last Updated: June 1, 2024
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-lg max-w-none">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h2 className="flex items-center text-2xl font-bold text-gray-900 mb-4">
                <FaShieldAlt className="text-blue-600 mr-2" />
                Introduction
              </h2>
              <p>
                DreamLift ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our crowdfunding platform.
              </p>
              <p>
                Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the site.
              </p>

              <h2 className="flex items-center text-2xl font-bold text-gray-900 mt-8 mb-4">
                <FaUserShield className="text-blue-600 mr-2" />
                Information We Collect
              </h2>
              <p>
                We collect information that you provide directly to us when you:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>Register for an account</li>
                <li>Create or modify your profile</li>
                <li>Create a campaign</li>
                <li>Make a donation</li>
                <li>Contact customer support</li>
                <li>Sign up for our newsletter</li>
                <li>Participate in surveys or promotions</li>
              </ul>
              <p>
                This information may include:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>Personal identifiers (name, email address, phone number)</li>
                <li>Account credentials</li>
                <li>Profile information (biography, location, profile picture)</li>
                <li>Payment and transaction information</li>
                <li>Campaign details and content</li>
                <li>Communications with us</li>
                <li>Survey responses</li>
              </ul>

              <h2 className="flex items-center text-2xl font-bold text-gray-900 mt-8 mb-4">
                <FaGlobe className="text-blue-600 mr-2" />
                Information Collected Automatically
              </h2>
              <p>
                When you access our platform, we automatically collect certain information about your device and usage, including:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>Device information (IP address, browser type, operating system)</li>
                <li>Usage data (pages visited, time spent, referring website)</li>
                <li>Location information</li>
                <li>Log data</li>
              </ul>

              <h2 className="flex items-center text-2xl font-bold text-gray-900 mt-8 mb-4">
                <FaCookieBite className="text-blue-600 mr-2" />
                Cookies and Tracking Technologies
              </h2>
              <p>
                We use cookies and similar tracking technologies to collect information about your browsing activities and to distinguish you from other users of our platform. This helps us provide you with a good experience when you browse our platform and allows us to improve its functionality.
              </p>
              <p>
                You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our platform.
              </p>

              <h2 className="flex items-center text-2xl font-bold text-gray-900 mt-8 mb-4">
                <FaLock className="text-blue-600 mr-2" />
                How We Use Your Information
              </h2>
              <p>
                We use the information we collect for various purposes, including to:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>Provide, maintain, and improve our platform</li>
                <li>Process transactions and send related information</li>
                <li>Verify your identity and prevent fraud</li>
                <li>Send administrative messages and updates</li>
                <li>Respond to your comments, questions, and requests</li>
                <li>Provide customer service and support</li>
                <li>Send promotional communications about new features, campaigns, or events</li>
                <li>Monitor and analyze trends, usage, and activities</li>
                <li>Personalize your experience</li>
                <li>Comply with legal obligations</li>
              </ul>

              <h2 className="flex items-center text-2xl font-bold text-gray-900 mt-8 mb-4">
                <FaUserShield className="text-blue-600 mr-2" />
                Sharing Your Information
              </h2>
              <p>
                We may share your information in the following circumstances:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>With service providers who perform services on our behalf</li>
                <li>With payment processors to complete transactions</li>
                <li>With campaign creators when you make a donation</li>
                <li>With other users when you create a public profile or campaign</li>
                <li>In response to legal process or government request</li>
                <li>To protect our rights, privacy, safety, or property</li>
                <li>In connection with a merger, acquisition, or sale of assets</li>
              </ul>

              <h2 className="flex items-center text-2xl font-bold text-gray-900 mt-8 mb-4">
                <FaLock className="text-blue-600 mr-2" />
                Data Security
              </h2>
              <p>
                We implement appropriate technical and organizational measures to protect the security of your personal information. However, please be aware that no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
              </p>

              <h2 className="flex items-center text-2xl font-bold text-gray-900 mt-8 mb-4">
                <FaGlobe className="text-blue-600 mr-2" />
                International Data Transfers
              </h2>
              <p>
                Your information may be transferred to, and maintained on, computers located outside of your state, province, country, or other governmental jurisdiction where the data protection laws may differ from those in your jurisdiction.
              </p>

              <h2 className="flex items-center text-2xl font-bold text-gray-900 mt-8 mb-4">
                <FaUserShield className="text-blue-600 mr-2" />
                Your Rights and Choices
              </h2>
              <p>
                Depending on your location, you may have certain rights regarding your personal information, including:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>Accessing, correcting, or deleting your personal information</li>
                <li>Withdrawing your consent</li>
                <li>Objecting to or restricting certain processing</li>
                <li>Requesting data portability</li>
                <li>Lodging a complaint with a supervisory authority</li>
              </ul>
              <p>
                To exercise these rights, please contact us using the information provided at the end of this policy.
              </p>

              <h2 className="flex items-center text-2xl font-bold text-gray-900 mt-8 mb-4">
                <FaCookieBite className="text-blue-600 mr-2" />
                Children's Privacy
              </h2>
              <p>
                Our platform is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us.
              </p>

              <h2 className="flex items-center text-2xl font-bold text-gray-900 mt-8 mb-4">
                <FaShieldAlt className="text-blue-600 mr-2" />
                Changes to This Privacy Policy
              </h2>
              <p>
                We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date. You are advised to review this Privacy Policy periodically for any changes.
              </p>
            </motion.div>
          </div>

          {/* Contact Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-12 p-6 bg-gray-50 rounded-lg text-center"
          >
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Contact Us</h3>
            <p className="text-gray-600 mb-4">
              If you have any questions about this Privacy Policy, please contact us at:
            </p>
            <div className="flex items-center justify-center text-blue-600 font-medium">
              <FaEnvelope className="mr-2" />
              <span>privacy@dreamlift.com</span>
            </div>
            <div className="mt-4">
              <Link to="/terms" className="text-blue-600 hover:text-blue-800 font-medium">
                View our Terms of Service →
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Privacy;