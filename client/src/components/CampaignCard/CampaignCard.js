import React from 'react';
import { Link } from 'react-router-dom';
import { FaMapMarkerAlt, FaClock } from 'react-icons/fa';
import placeholderCampaign from '../../assets/placeholder-campaign.svg';
import placeholderAvatar from '../../assets/placeholder-avatar.svg';

const CampaignCard = ({ campaign }) => {
  if (!campaign) return null;

  const {
    _id,
    title,
    description,
    goal,
    raisedAmount = 0,
    deadline,
    category,
    creator,
    images = [],
    location
  } = campaign;

  const progressPercentage = goal > 0 ? Math.min((raisedAmount / goal) * 100, 100) : 0;
  const daysLeft = deadline ? Math.max(0, Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24))) : 0;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 h-full">
      <Link to={`/campaigns/${_id}`}>
        <div className="relative">
          <img
            src={images && images[0] ? (images[0].url || images[0]) : placeholderCampaign}
            alt={title}
            className="w-full h-40 sm:h-48 object-cover"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = placeholderCampaign;
            }}
          />
          <div className="absolute top-2 left-2">
            <span className="bg-primary-600 text-white px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium">
              {category}
            </span>
          </div>
        </div>
      </Link>

      <div className="p-3 sm:p-4">
        <Link to={`/campaigns/${_id}`}>
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2 hover:text-primary-600 transition-colors">
            {title}
          </h3>
        </Link>
        
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {description}
        </p>

        <div className="mb-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium text-gray-700">
              ₹{raisedAmount?.toLocaleString()} raised
            </span>
            <span className="text-sm text-gray-500">
              {progressPercentage.toFixed(0)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <div className="text-sm text-gray-500 mt-1">
            Goal: ₹{goal?.toLocaleString()}
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center">
            <FaClock className="mr-1" />
            <span>{daysLeft} days left</span>
          </div>
          {location && (
            <div className="flex items-center">
              <FaMapMarkerAlt className="mr-1" />
              <span>
                {typeof location === 'string' 
                  ? location 
                  : [location.city, location.state, location.country]
                      .filter(Boolean)
                      .join(', ')
                }
              </span>
            </div>
          )}
        </div>

        {creator && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center">
              <img
                src={creator.avatar?.url || creator.avatar || placeholderAvatar}
                alt={creator.name}
                className="w-6 h-6 rounded-full mr-2"
                onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = placeholderAvatar;
                  }}
              />
              <span className="text-sm text-gray-600">by {creator.name}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CampaignCard;