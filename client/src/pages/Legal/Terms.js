import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FaShieldAlt, FaHandshake, FaFileContract, FaGavel, FaUserShield, FaMoneyBillWave } from 'react-icons/fa';

const Terms = () => {
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
              Terms of Service
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 mb-6">
              Please read these terms carefully before using our platform
            </p>
            <div className="flex items-center justify-center">
              <FaFileContract className="text-blue-600 text-2xl sm:text-3xl mr-2" />
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
                <FaHandshake className="text-blue-600 mr-2" />
                Agreement to Terms
              </h2>
              <p>
                By accessing or using the DreamLift platform, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.
              </p>

              <h2 className="flex items-center text-2xl font-bold text-gray-900 mt-8 mb-4">
                <FaUserShield className="text-blue-600 mr-2" />
                User Accounts
              </h2>
              <p>
                When you create an account with us, you must provide information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our platform.
              </p>
              <p>
                You are responsible for safeguarding the password that you use to access the platform and for any activities or actions under your password. You agree not to disclose your password to any third party. You must notify us immediately upon becoming aware of any breach of security or unauthorized use of your account.
              </p>

              <h2 className="flex items-center text-2xl font-bold text-gray-900 mt-8 mb-4">
                <FaMoneyBillWave className="text-blue-600 mr-2" />
                Campaigns and Donations
              </h2>
              <p>
                DreamLift provides a platform for campaign creators to raise funds for various causes. We do not guarantee that campaigns will reach their funding goals or that funds will be used as described by campaign creators.
              </p>
              <p>
                As a donor, you understand that making a contribution to a campaign does not give you any ownership or rights to the campaign. All donations are voluntary and at your own risk. We recommend researching campaigns thoroughly before donating.
              </p>
              <p>
                Campaign creators are responsible for fulfilling any promises made in their campaign descriptions, including delivering rewards if offered. DreamLift is not responsible for a campaign creator's failure to complete their project or fulfill rewards.
              </p>

              <h2 className="flex items-center text-2xl font-bold text-gray-900 mt-8 mb-4">
                <FaShieldAlt className="text-blue-600 mr-2" />
                Platform Fees
              </h2>
              <p>
                DreamLift charges a platform fee of 5% on successfully funded campaigns, plus payment processing fees. These fees help us maintain and improve our platform services. All fees are clearly displayed before campaign creation and donation processing.
              </p>

              <h2 className="flex items-center text-2xl font-bold text-gray-900 mt-8 mb-4">
                <FaGavel className="text-blue-600 mr-2" />
                Prohibited Activities
              </h2>
              <p>
                You may not use our platform for any illegal or unauthorized purpose. You must not, in the use of the Service, violate any laws in your jurisdiction (including but not limited to copyright laws).
              </p>
              <p>
                Prohibited activities include but are not limited to:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>Creating fraudulent campaigns or misrepresenting campaign purposes</li>
                <li>Posting defamatory, abusive, or threatening content</li>
                <li>Impersonating another person or entity</li>
                <li>Using the platform to distribute spam or malware</li>
                <li>Attempting to gain unauthorized access to other user accounts or platform systems</li>
                <li>Using the platform to promote illegal activities or products</li>
              </ul>

              <h2 className="flex items-center text-2xl font-bold text-gray-900 mt-8 mb-4">
                <FaFileContract className="text-blue-600 mr-2" />
                Intellectual Property
              </h2>
              <p>
                The Service and its original content, features, and functionality are and will remain the exclusive property of DreamLift and its licensors. The Service is protected by copyright, trademark, and other laws of both India and foreign countries.
              </p>
              <p>
                By posting content on the platform, you grant DreamLift a non-exclusive, worldwide, royalty-free license to use, reproduce, modify, adapt, publish, translate, and distribute your content in any existing or future media formats.
              </p>

              <h2 className="flex items-center text-2xl font-bold text-gray-900 mt-8 mb-4">
                <FaHandshake className="text-blue-600 mr-2" />
                Termination
              </h2>
              <p>
                We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms. Upon termination, your right to use the Service will immediately cease.
              </p>

              <h2 className="flex items-center text-2xl font-bold text-gray-900 mt-8 mb-4">
                <FaShieldAlt className="text-blue-600 mr-2" />
                Limitation of Liability
              </h2>
              <p>
                In no event shall DreamLift, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.
              </p>

              <h2 className="flex items-center text-2xl font-bold text-gray-900 mt-8 mb-4">
                <FaGavel className="text-blue-600 mr-2" />
                Governing Law
              </h2>
              <p>
                These Terms shall be governed and construed in accordance with the laws of India, without regard to its conflict of law provisions. Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights.
              </p>

              <h2 className="flex items-center text-2xl font-bold text-gray-900 mt-8 mb-4">
                <FaFileContract className="text-blue-600 mr-2" />
                Changes to Terms
              </h2>
              <p>
                We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material we will try to provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
              </p>
              <p>
                By continuing to access or use our Service after those revisions become effective, you agree to be bound by the revised terms. If you do not agree to the new terms, please stop using the Service.
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
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Have Questions?</h3>
            <p className="text-gray-600 mb-4">
              If you have any questions about these Terms, please contact us at:
            </p>
            <p className="text-blue-600 font-medium">support@dreamlift.com</p>
            <div className="mt-4">
              <Link to="/privacy" className="text-blue-600 hover:text-blue-800 font-medium">
                View our Privacy Policy →
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Terms;