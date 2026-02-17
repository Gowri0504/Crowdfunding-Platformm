import React from 'react';
import { Link } from 'react-router-dom';
// Removed unused imports
import { motion } from 'framer-motion';
import { FaRegClock, FaRegHeart, FaRegBookmark } from 'react-icons/fa';
import placeholderCampaign from '../../assets/placeholder-campaign.svg';

const CampaignCard = ({ campaign }) => {
  // Calculate days remaining or show expired
  const getDaysRemaining = () => {
    if (!campaign.deadline) return 'No deadline';
    
    const now = new Date();
    const deadline = new Date(campaign.deadline);
    const diffTime = deadline - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) return 'Expired';
    return `${diffDays} days left`;
  };

  // Format currency
  const formatCurrency = (amount, currency = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Calculate progress percentage
  const getProgressPercentage = () => {
    if (!campaign.targetAmount || campaign.targetAmount === 0) return 0;
    const percentage = (campaign.currentAmount / campaign.targetAmount) * 100;
    return Math.min(percentage, 100);
  };

  return (
    <motion.div 
      className="card hover-lift overflow-hidden h-full flex flex-col"
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
    >
      {/* Campaign Image */}
      <div className="relative">
        <Link to={`/campaigns/${campaign._id}`} className="block aspect-video overflow-hidden">
          <img 
            src={campaign.images && campaign.images.length > 0 && campaign.images[0].url ? campaign.images[0].url : placeholderCampaign} 
            alt={campaign.title} 
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = placeholderCampaign;
            }}
          />
        </Link>
        
        {/* Category Badge */}
        <div className="absolute top-2 left-2">
          <span className={`badge badge-sm category-${campaign.category}`}>
            {campaign.category.charAt(0).toUpperCase() + campaign.category.slice(1)}
          </span>
        </div>
        
        {/* Verification Badge (if verified) */}
        {campaign.isVerified && (
          <div className="absolute top-2 right-2">
            <span className="badge badge-sm badge-success">
              Verified
            </span>
          </div>
        )}
      </div>
      
      {/* Campaign Content */}
      <div className="card-body flex-grow flex flex-col">
        <Link to={`/campaigns/${campaign._id}`} className="block">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-primary-600 transition-colors">
            {campaign.title}
          </h3>
        </Link>
        
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {campaign.shortDescription}
        </p>
        
        {/* Progress Bar */}
        <div className="mt-auto">
          <div className="flex justify-between text-sm mb-1">
            <span className="font-semibold text-gray-900">
              {formatCurrency(campaign.currentAmount, campaign.currency)}
            </span>
            <span className="text-gray-500">
              {getProgressPercentage().toFixed(0)}%
            </span>
          </div>
          
          <div className="progress mb-3">
            <div 
              className="progress-bar" 
              style={{ width: `${getProgressPercentage()}%` }}
            ></div>
          </div>
          
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center text-gray-500">
              <FaRegClock className="mr-1" />
              <span>{getDaysRemaining()}</span>
            </div>
            
            <div className="flex items-center space-x-3">
              <span className="text-gray-500 flex items-center">
                <FaRegHeart className="mr-1" />
                {campaign.socialProof?.donorCount || 0}
              </span>
              
              <span className="text-gray-500">
                <FaRegBookmark />
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CampaignCard;