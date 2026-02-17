import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaSearch, FaMapMarkerAlt, FaPlus, FaHandHoldingUsd } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { campaignsAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import CampaignCard from '../../components/CampaignCard/CampaignCard';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import sampleCampaigns from '../../data/sampleCampaigns';

const Campaigns = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const categories = [
    'Technology',
    'Health',
    'Education',
    'Environment',
    'Arts',
    'Community',
    'Sports',
    'Business',
    'Emergency',
    'Other'
  ];

  const sortOptions = [
    { value: 'createdAt', label: 'Newest First' },
    { value: '-createdAt', label: 'Oldest First' },
    { value: 'goal', label: 'Goal Amount (Low to High)' },
    { value: '-goal', label: 'Goal Amount (High to Low)' },
    { value: 'deadline', label: 'Ending Soon' },
    { value: '-raisedAmount', label: 'Most Funded' }
  ];

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 12,
        category: selectedCategory,
        sort: sortBy
      };
      
      // Use search API endpoint if search term is provided
      let response;
      if (searchTerm && searchTerm.trim() !== '') {
        response = await campaignsAPI.search(searchTerm, params);
      } else {
        response = await campaignsAPI.getCampaigns(params);
      }
      
      // Server sends: { success: true, message, data: { campaigns, pagination } }
      if (response.data && response.data.data) {
        setCampaigns(response.data.data.campaigns || []);
        setTotalPages(response.data.data.pagination?.totalPages || 1);
      } else {
        // Fallback for different response structure
        setCampaigns([]);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      
      // Use sample campaign data if there's a network error
      if (error.message === 'Network error') {
        // Filter sample campaigns based on category if selected
        let filteredCampaigns = [...sampleCampaigns];
        if (selectedCategory) {
          filteredCampaigns = filteredCampaigns.filter(campaign => 
            campaign.category.toLowerCase() === selectedCategory.toLowerCase());
        }
        
        // Filter by search term if provided
        if (searchTerm) {
          filteredCampaigns = filteredCampaigns.filter(campaign => 
            campaign.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
            campaign.description.toLowerCase().includes(searchTerm.toLowerCase()));
        }
        
        setCampaigns(filteredCampaigns);
        setTotalPages(1);
        toast.success('Loaded sample campaign data');
      } else {
        toast.error('Failed to load campaigns');
        setCampaigns([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, [currentPage, sortBy, selectedCategory, searchTerm]);

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchCampaigns();
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category === selectedCategory ? '' : category);
    setCurrentPage(1);
  };

  const handleSortChange = (sort) => {
    setSortBy(sort);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading && campaigns.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-600 to-secondary-600 text-white py-10 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4">
              Discover Amazing Campaigns
            </h1>
            <p className="text-lg sm:text-xl text-primary-100 mb-6 sm:mb-8 max-w-2xl mx-auto px-2 sm:px-0">
              Support innovative projects, help communities, and be part of something bigger
            </p>
            
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <div className="flex-1 relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search campaigns..."
                    className="w-full pl-10 pr-4 py-3 rounded-lg text-gray-900 focus:ring-2 focus:ring-primary-300"
                  />
                </div>
                <button
                  type="submit"
                  className="btn bg-white text-primary-600 hover:bg-gray-100 px-6 sm:px-8 py-2.5 sm:py-3"
                >
                  Search
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </section>
      
      {/* Featured Sample Campaigns */}
      <section className="bg-white py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Featured Campaigns</h2>
            <p className="mt-2 text-lg text-gray-600">Support these worthy causes today</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {sampleCampaigns.slice(0, 2).map((campaign) => (
              <div key={campaign.id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
                <div className="flex flex-col sm:flex-row">
                  <div className="sm:w-2/5">
                    <img 
                      src={campaign.images[0]?.url || campaign.images[0]} 
                      alt={campaign.title} 
                      className="w-full h-48 sm:h-full object-cover"
                    />
                  </div>
                  <div className="sm:w-3/5 p-4 sm:p-6 flex flex-col">
                    <div>
                      <span className="bg-primary-100 text-primary-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                        {campaign.category}
                      </span>
                      <h3 className="mt-2 text-xl font-bold text-gray-900">{campaign.title}</h3>
                      <p className="mt-2 text-gray-600 line-clamp-2">{campaign.description}</p>
                    </div>
                    
                    <div className="mt-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-gray-700">
                          ${campaign.amountRaised?.toLocaleString()} raised
                        </span>
                        <span className="text-gray-500">
                          {Math.round((campaign.amountRaised / campaign.target) * 100)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-primary-600 h-2.5 rounded-full" 
                          style={{ width: `${Math.min(100, Math.round((campaign.amountRaised / campaign.target) * 100))}%` }}
                        ></div>
                      </div>
                      <p className="mt-1 text-sm text-gray-500">Goal: ${campaign.target?.toLocaleString()}</p>
                    </div>
                    
                    <div className="mt-auto pt-4 flex flex-col sm:flex-row gap-3 sm:gap-4">
                      <Link 
                        to={`/campaigns/${campaign.id}`} 
                        className="btn-outline text-center py-2 flex-1"
                      >
                        View Details
                      </Link>
                      <button 
                        className="btn-primary py-2 flex-1 flex items-center justify-center gap-2"
                        onClick={() => navigate(`/campaigns/${campaign.id}`)}
                      >
                        <FaHandHoldingUsd /> Donate Now
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Filters and Sort */}
      <section className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4">
            {/* Categories */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleCategoryChange('')}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-colors ${
                  selectedCategory === '' 
                    ? 'bg-primary-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Categories
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => handleCategoryChange(category)}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-colors ${
                    selectedCategory === category 
                      ? 'bg-primary-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Sort Options */}
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-primary-500"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Campaigns Grid */}
      <section className="py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          {loading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : campaigns.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {campaigns.map((campaign, index) => (
                  <motion.div
                    key={campaign._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                  >
                    <CampaignCard campaign={campaign} />
                  </motion.div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-8 sm:mt-12">
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      Previous
                    </button>
                    
                    {[...Array(totalPages)].map((_, index) => {
                      const page = index + 1;
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 2 && page <= currentPage + 2)
                      ) {
                        return (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-sm ${
                              currentPage === page
                                ? 'bg-primary-600 text-white'
                                : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      } else if (
                        page === currentPage - 3 ||
                        page === currentPage + 3
                      ) {
                        return <span key={page} className="px-2">...</span>;
                      }
                      return null;
                    })}
                    
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaSearch className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">No campaigns found</h3>
              <p className="text-gray-600 mb-4 sm:mb-6 px-4 sm:px-0">
                {searchTerm || selectedCategory 
                  ? 'Try adjusting your search criteria or browse all campaigns'
                  : 'Be the first to create a campaign and start making a difference!'
                }
              </p>
              {user && (
                <a
                  href="/campaigns/create"
                  className="btn-primary inline-flex items-center text-sm sm:text-base py-2 sm:py-2.5 px-4 sm:px-6"
                >
                  <FaPlus className="mr-2" />
                  Create Campaign
                </a>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Campaigns;