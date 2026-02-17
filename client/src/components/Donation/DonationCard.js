import React from 'react';
import { Link } from 'react-router-dom';
import { FaRegCalendarAlt, FaReceipt, FaExternalLinkAlt } from 'react-icons/fa';

const DonationCard = ({ donation }) => {
  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  // Format currency
  const formatCurrency = (amount, currency = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'completed':
        return 'badge-success';
      case 'pending':
        return 'badge-warning';
      case 'failed':
        return 'badge-danger';
      case 'refunded':
        return 'badge-secondary';
      default:
        return 'badge-primary';
    }
  };

  return (
    <div className="card hover-lift overflow-hidden mb-4">
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold text-gray-900">
              {donation.campaign ? (
                <Link 
                  to={`/campaigns/${donation.campaign._id}`}
                  className="hover:text-primary-600 transition-colors"
                >
                  {donation.campaign.title}
                </Link>
              ) : (
                <span className="text-gray-500">Campaign no longer available</span>
              )}
            </h3>
            <div className="flex items-center text-sm text-gray-500 mt-1">
              <FaRegCalendarAlt className="mr-1" />
              <span>{formatDate(donation.createdAt)}</span>
            </div>
          </div>
          
          <div className="flex flex-col items-end">
            <span className="font-semibold text-lg text-gray-900">
              {formatCurrency(donation.amount, donation.currency)}
            </span>
            <span className={`badge ${getStatusBadgeClass(donation.status)} mt-1`}>
              {donation.status.charAt(0).toUpperCase() + donation.status.slice(1)}
            </span>
          </div>
        </div>
        
        {donation.message && (
          <div className="bg-gray-50 p-3 rounded-md text-sm text-gray-600 mb-3">
            <p className="italic">{donation.message}</p>
          </div>
        )}
        
        <div className="flex justify-between items-center mt-2">
          {donation.anonymous ? (
            <span className="text-sm text-gray-500">Anonymous donation</span>
          ) : (
            <span className="text-sm text-gray-500">
              {donation.donor ? donation.donor.name : 'Unknown donor'}
            </span>
          )}
          
          <div className="flex space-x-2">
            {donation.status === 'completed' && (
              <Link 
                to={`/donations/${donation._id}/receipt`}
                className="btn btn-sm btn-ghost"
                title="View Receipt"
              >
                <FaReceipt />
              </Link>
            )}
            
            <Link 
              to={`/donations/${donation._id}`}
              className="btn btn-sm btn-ghost"
              title="View Details"
            >
              <FaExternalLinkAlt />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DonationCard;