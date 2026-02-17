import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaFilter, FaSort, FaChevronDown, FaChevronUp, FaSearch } from 'react-icons/fa';
import CampaignCard from '../../components/CampaignCard/CampaignCard';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import { campaignsAPI } from '../../services/api';

const CategoryCampaigns = () => {
  const { category } = useParams();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('newest');
  const [filterOpen, setFilterOpen] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 1000000]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Format category name for display
  const formattedCategory = category
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  useEffect(() => {
    fetchCampaigns();
  }, [category, sortBy, searchTerm, priceRange]);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Determine sort parameter based on sortBy state
      let sortParam = '';
      switch (sortBy) {
        case 'newest':
          sortParam = '-createdAt';
          break;
        case 'oldest':
          sortParam = 'createdAt';
          break;
        case 'most-funded':
          sortParam = '-raisedAmount';
          break;
        case 'least-funded':
          sortParam = 'raisedAmount';
          break;
        case 'ending-soon':
          sortParam = 'endDate';
          break;
        default:
          sortParam = '-createdAt';
      }
      
      const params = {
        sort: sortParam,
        limit: 50,
        search: searchTerm,
        minAmount: priceRange[0],
        maxAmount: priceRange[1]
      };
      
      // Use getByCategory instead of getCampaigns with category param
      const response = await campaignsAPI.getByCategory(category, params);
      
      setCampaigns(response.data.campaigns || []);
    } catch (err) {
      console.error('Error fetching campaigns:', err);
      setError('Failed to load campaigns. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Filter campaigns based on search term and price range
  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = searchTerm === '' || 
      campaign.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campaign.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPriceRange = 
      campaign.goalAmount >= priceRange[0] && 
      campaign.goalAmount <= priceRange[1];
    
    return matchesSearch && matchesPriceRange;
  });

  // Animation variants for staggered list
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 flex justify-center items-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold text-gray-900 mb-4"
          >
            {formattedCategory} Campaigns
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-gray-600 max-w-3xl mx-auto"
          >
            Discover and support innovative {formattedCategory.toLowerCase()} projects from creators around the world
          </motion.p>
        </div>

        {/* Search and Filter Section */}
        <div className="mb-8 bg-white rounded-xl shadow-md p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="relative flex-grow max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Search campaigns"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex flex-wrap gap-2">
              <div className="relative inline-block text-left">
                <button
                  type="button"
                  className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  onClick={() => setFilterOpen(!filterOpen)}
                >
                  <FaFilter className="mr-2 h-5 w-5 text-gray-400" />
                  Filter
                  {filterOpen ? (
                    <FaChevronUp className="ml-2 h-5 w-5 text-gray-400" />
                  ) : (
                    <FaChevronDown className="ml-2 h-5 w-5 text-gray-400" />
                  )}
                </button>

                {filterOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                    <div className="py-1 p-3" role="menu" aria-orientation="vertical">
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Price Range</label>
                        <div className="flex items-center space-x-2">
                          <input 
                            type="number" 
                            min="0"
                            value={priceRange[0]}
                            onChange={(e) => setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          />
                          <span>to</span>
                          <input 
                            type="number"
                            min={priceRange[0]}
                            value={priceRange[1]}
                            onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value) || 0])}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="most-funded">Most Funded</option>
                <option value="least-funded">Least Funded</option>
                <option value="ending-soon">Ending Soon</option>
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-8">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Campaign Grid */}
        {filteredCampaigns.length > 0 ? (
          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {filteredCampaigns.map((campaign) => (
              <motion.div key={campaign._id} variants={itemVariants}>
                <CampaignCard campaign={campaign} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No campaigns found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'Try adjusting your search or filter criteria.' : `No ${formattedCategory.toLowerCase()} campaigns available at the moment.`}
            </p>
            <div className="mt-6">
              <Link
                to="/campaigns/create"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Create a campaign
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryCampaigns;