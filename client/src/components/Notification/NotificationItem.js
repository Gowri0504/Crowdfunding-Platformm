import React from 'react';
import { Link } from 'react-router-dom';
import { FaRegClock, FaCheckCircle, FaBell, FaMoneyBillWave, FaComment, FaBullhorn, FaInfoCircle } from 'react-icons/fa';

const NotificationItem = ({ notification, onMarkAsRead, compact = false }) => {
  // Format date as relative time (e.g., "2 hours ago")
  const getRelativeTime = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffTime = Math.abs(now - date);
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffMinutes < 60) {
      return `${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
    } else {
      const options = { year: 'numeric', month: 'short', day: 'numeric' };
      return date.toLocaleDateString('en-US', options);
    }
  };

  // Get notification icon based on type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'donation_received':
      case 'donation_completed':
        return <FaMoneyBillWave className="text-success-500" />;
      case 'comment_received':
      case 'comment_replied':
        return <FaComment className="text-primary-500" />;
      case 'campaign_created':
      case 'campaign_approved':
      case 'campaign_rejected':
      case 'campaign_update':
      case 'campaign_goal_reached':
      case 'campaign_ending_soon':
      case 'campaign_ended':
        return <FaBullhorn className="text-warning-500" />;
      case 'welcome':
      case 'admin_message':
        return <FaInfoCircle className="text-secondary-500" />;
      default:
        return <FaBell className="text-gray-500" />;
    }
  };

  // Get notification link based on type and data
  const getNotificationLink = () => {
    const { data = {} } = notification;
    
    if (data.url) return data.url;
    
    switch (notification.type) {
      case 'donation_received':
      case 'donation_completed':
        return data.donation ? `/donations/${data.donation._id}` : '#';
      case 'comment_received':
      case 'comment_replied':
        return data.campaign ? `/campaigns/${data.campaign._id || data.campaign}/comments` : '#';
      case 'campaign_created':
      case 'campaign_approved':
      case 'campaign_rejected':
      case 'campaign_update':
      case 'campaign_goal_reached':
      case 'campaign_ending_soon':
      case 'campaign_ended':
        return data.campaign ? `/campaigns/${data.campaign._id || data.campaign}` : '#';
      default:
        return '#';
    }
  };

  if (compact) {
    return (
      <div className={`p-3 border-b hover:bg-gray-50 ${!notification.isRead ? 'bg-blue-50' : ''}`}>
        <Link to={getNotificationLink()} className="block">
          <div className="flex items-start">
            <div className="mr-2 mt-0.5">
              {getNotificationIcon(notification.type)}
            </div>
            
            <div className="flex-grow min-w-0">
              <p className={`text-sm ${!notification.isRead ? 'font-medium text-gray-900' : 'text-gray-700'} truncate`}>
                {notification.message || notification.title}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {getRelativeTime(notification.createdAt)}
              </p>
            </div>
            
            {!notification.isRead && (
              <div className="ml-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              </div>
            )}
          </div>
        </Link>
      </div>
    );
  }

  return (
    <div className={`p-4 border-b ${!notification.isRead ? 'bg-primary-50' : ''}`}>
      <div className="flex items-start">
        <div className="mr-3 mt-1">
          {getNotificationIcon(notification.type)}
        </div>
        
        <div className="flex-grow">
          <Link to={getNotificationLink()} className="block">
            <p className="text-gray-900 mb-1">
              {notification.message || notification.title}
            </p>
          </Link>
          
          <div className="flex justify-between items-center text-xs text-gray-500">
            <div className="flex items-center">
              <FaRegClock className="mr-1" />
              <span>{getRelativeTime(notification.createdAt)}</span>
            </div>
            
            {!notification.isRead && (
              <button 
                onClick={() => onMarkAsRead(notification._id)}
                className="flex items-center text-primary-600 hover:text-primary-700"
              >
                <FaCheckCircle className="mr-1" />
                <span>Mark as read</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationItem;