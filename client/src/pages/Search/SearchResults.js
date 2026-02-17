import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaSearch, FaFilter, FaChevronDown, FaChevronUp, FaTimes } from 'react-icons/fa';
import CampaignCard from '../../components/CampaignCard/CampaignCard';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import axios from '../../axios';

const SearchResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const initialQuery = queryParams.get('q') || '';
  const initialCategory = queryParams.get('category') || '';
  
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [sortBy, setSortBy] = useState('relevance');
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  
  // List of available categories
  const categories = [
    { id: 'technology', name: 'Technology' },
    { id: 'art', name: 'Art' },
    { id: 'music', name: 'Music' },
    { id: 'film', name: 'Film & Video' },
    { id: 'games', name: 'Games' },
    { id: 'design', name: 'Design' },
    { id: 'food', name: 'Food' },
    { id: 'publishing', name: 'Publishing' },
    { id: 'fashion', name: 'Fashion' },
    { id: 'community', name: 'Community' },
  ];

  const performSearch = async () => {
    if (!searchQuery.trim()) return;
    
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
        case 'ending-soon':
          sortParam = 'endDate';
          break;
        case 'relevance':
        default:
          sortParam = 'relevance';
      }
      
      const params = {
        q: searchQuery,
        sort: sortParam,
        limit: 50,
        page: currentPage
      };
      
      if (selectedCategory) {
        params.category = selectedCategory;
      }
      
      const response = await axios.get('/api/campaigns/search', { params });
      
      setCampaigns(response.data.campaigns || []);
      setTotalResults(response.data.total || 0);
      
      // Update URL with search parameters
      const searchParams = new URLSearchParams();
      searchParams.set('q', searchQuery);
      if (selectedCategory) searchParams.set('category', selectedCategory);
      navigate(`/search?${searchParams.toString()}`, { replace: true });
      
    } catch (err) {
      console.error('Error searching campaigns:', err);
      setError('Failed to search campaigns. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery || searchQuery) {
      performSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, selectedCategory, sortBy, currentPage]);

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    performSearch();
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category === selectedCategory ? '' : category);
    setCurrentPage(1);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSortBy('relevance');
    setCurrentPage(1);
    navigate('/search');
    setCampaigns([]);
    setTotalResults(0);
  };

  // Animation variants
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

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold text-gray-900 mb-4"
          >
            Search Campaigns
          </motion.h1>
        </div>

        {/* Search Form */}
        <div className="max-w-3xl mx-auto mb-8">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Search for campaigns..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setSearchQuery('')}
                >
                  <FaTimes className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Search
            </button>
          </form>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              {searchQuery && (
                <p className="text-sm text-gray-600">
                  {totalResults} results for "{searchQuery}"
                  {selectedCategory && ` in ${categories.find(c => c.id === selectedCategory)?.name || selectedCategory}`}
                </p>
              )}
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">Categories</label>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {categories.map((category) => (
                            <div key={category.id} className="flex items-center">
                              <input
                                id={`category-${category.id}`}
                                name="category"
                                type="radio"
                                checked={selectedCategory === category.id}
                                onChange={() => handleCategoryChange(category.id)}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                              />
                              <label htmlFor={`category-${category.id}`} className="ml-3 block text-sm text-gray-700">
                                {category.name}
                              </label>
                            </div>
                          ))}
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
                <option value="relevance">Most Relevant</option>
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="most-funded">Most Funded</option>
                <option value="ending-soon">Ending Soon</option>
              </select>

              {(searchQuery || selectedCategory) && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Error Message */}
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

        {/* Loading Indicator */}
        {loading && (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="large" />
          </div>
        )}

        {/* Results */}
        {!loading && campaigns.length > 0 && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {campaigns.map((campaign) => (
              <motion.div key={campaign._id} variants={itemVariants}>
                <CampaignCard campaign={campaign} />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* No Results */}
        {!loading && searchQuery && campaigns.length === 0 && (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47-.881-6.08-2.33" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No campaigns found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your search terms or filters.
              </p>
              <div className="mt-6">
                <button
                  type="button"
                  onClick={clearSearch}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Clear search
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Default state when no search */}
        {!loading && !searchQuery && campaigns.length === 0 && (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <FaSearch className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Start searching</h3>
              <p className="mt-1 text-sm text-gray-500">
                Enter keywords to find campaigns that interest you.
              </p>
              <div className="mt-6">
                <Link
                  to="/campaigns"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Browse all campaigns
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResults;