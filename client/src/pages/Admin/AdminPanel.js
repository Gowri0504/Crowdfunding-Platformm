import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  FaCheckCircle, FaTimesCircle, FaEye, FaClock, FaUser, FaCalendarAlt, 
  FaDollarSign, FaMapMarkerAlt, FaUsers, FaChartBar, FaCog, FaTachometerAlt,
  FaFileAlt, FaSearch, FaEdit, FaTrash, FaDownload,
  FaUserShield, FaUserTimes, FaUserCheck, FaExclamationTriangle
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import axios from '../../axios';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

const AdminPanel = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Campaign states
  const [pendingCampaigns, setPendingCampaigns] = useState([]);
  const [allCampaigns, setAllCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  
  // User management states
  const [users, setUsers] = useState([]);
  
  // Analytics states
  const [analytics, setAnalytics] = useState({
    totalCampaigns: 0,
    totalUsers: 0,
    totalDonations: 0,
    totalRevenue: 0,
    pendingApprovals: 0,
    activeCampaigns: 0
  });
  
  // Financial reports states
  const [reportPeriod, setReportPeriod] = useState('monthly');
  const [reportLoading, setReportLoading] = useState(false);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Cache for API responses to prevent duplicate requests
  const [dataCache, setDataCache] = useState({
    lastFetch: null,
    campaigns: null,
    users: null,
    analytics: null
  });

  // Check if user is admin
  useEffect(() => {
    if (user && user.role !== 'admin') {
      toast.error('Access denied. Admin privileges required.');
      window.location.href = '/dashboard';
      return;
    }
    if (user) {
      fetchInitialData();
    }
  }, [user]);

  // Debounced fetch function to prevent rapid successive calls
  const fetchInitialData = useCallback(async (forceRefresh = false) => {
    const now = Date.now();
    const cacheExpiry = 5 * 60 * 1000; // 5 minutes cache
    
    // Check if we have recent cached data and don't force refresh
    if (!forceRefresh && dataCache.lastFetch && (now - dataCache.lastFetch) < cacheExpiry) {
      if (dataCache.campaigns) setPendingCampaigns(dataCache.campaigns.pending || []);
      if (dataCache.campaigns) setAllCampaigns(dataCache.campaigns.all || []);
      if (dataCache.users) setUsers(dataCache.users);
      if (dataCache.analytics) setAnalytics(dataCache.analytics);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Fetch all data in parallel but handle errors individually
      const [campaignsResult, usersResult, analyticsResult] = await Promise.allSettled([
        fetchCampaignsData(),
        fetchUsersData(),
        fetchAnalyticsData()
      ]);

      // Update cache
      const newCache = {
        lastFetch: now,
        campaigns: null,
        users: null,
        analytics: null
      };

      if (campaignsResult.status === 'fulfilled') {
        newCache.campaigns = campaignsResult.value;
      }
      if (usersResult.status === 'fulfilled') {
        newCache.users = usersResult.value;
      }
      if (analyticsResult.status === 'fulfilled') {
        newCache.analytics = analyticsResult.value;
      }

      setDataCache(newCache);

    } catch (error) {
      console.error('Error fetching initial data:', error);
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  }, [dataCache.lastFetch]);

  // Optimized campaign data fetching
  const fetchCampaignsData = async () => {
    try {
      const [pendingResponse, allResponse] = await Promise.all([
        axios.get('/api/admin/campaigns/pending'),
        axios.get('/api/admin/campaigns')
      ]);
      
      const pending = pendingResponse.data.data?.campaigns || [];
      const all = allResponse.data.data?.campaigns || [];
      
      setPendingCampaigns(pending);
      setAllCampaigns(all);
      
      return { pending, all };
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      return { pending: [], all: [] };
    }
  };

  // Optimized users data fetching
  const fetchUsersData = async () => {
    try {
      const response = await axios.get('/api/admin/users');
      const usersData = response.data.data?.users || [];
      setUsers(usersData);
      return usersData;
    } catch (error) {
      console.error('Error fetching users:', error);
      // Mock data for demonstration
      const mockUsers = [
        { _id: '1', name: 'John Doe', email: 'john@example.com', role: 'user', createdAt: new Date(), isActive: true },
        { _id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'creator', createdAt: new Date(), isActive: true }
      ];
      setUsers(mockUsers);
      return mockUsers;
    }
  };

  // Optimized analytics data fetching
  const fetchAnalyticsData = async () => {
    try {
      const response = await axios.get('/api/admin/analytics');
      const data = response.data.data;
      
      const analyticsData = {
        totalCampaigns: data.overview?.totalCampaigns || 0,
        totalUsers: data.overview?.totalUsers || 0,
        totalDonations: data.overview?.totalDonations || 0,
        totalRevenue: data.overview?.totalRevenue || 0,
        pendingApprovals: data.overview?.pendingCampaigns || 0,
        activeCampaigns: data.overview?.activeCampaigns || 0
      };
      
      setAnalytics(analyticsData);
      return analyticsData;
    } catch (error) {
      console.error('Error fetching analytics:', error);
      // Mock analytics data as fallback
      const mockAnalytics = {
        totalCampaigns: allCampaigns.length || 0,
        totalUsers: users.length || 0,
        totalDonations: 150,
        totalRevenue: 25000,
        pendingApprovals: pendingCampaigns.length || 0,
        activeCampaigns: allCampaigns.filter(c => c.status === 'active').length || 0
      };
      setAnalytics(mockAnalytics);
      return mockAnalytics;
    }
  };

  // Optimized campaign approval with minimal refetch
  const handleApproveCampaign = async (campaignId) => {
    if (!reviewNotes.trim()) {
      toast.error('Please provide review notes');
      return;
    }

    setActionLoading(true);
    try {
      const response = await axios.put(`/api/admin/campaigns/${campaignId}/approve`, {
        reviewNotes: reviewNotes.trim()
      });

      if (response.data.success) {
        toast.success('Campaign approved successfully!');
        
        // Update local state instead of refetching all data
        const updatedCampaign = response.data.data.campaign;
        
        // Remove from pending campaigns
        setPendingCampaigns(prev => prev.filter(c => c._id !== campaignId));
        
        // Update in all campaigns
        setAllCampaigns(prev => prev.map(c => 
          c._id === campaignId ? updatedCampaign : c
        ));
        
        // Update analytics locally
        setAnalytics(prev => ({
          ...prev,
          pendingApprovals: Math.max(0, prev.pendingApprovals - 1),
          activeCampaigns: prev.activeCampaigns + 1
        }));
        
        setSelectedCampaign(null);
        setReviewNotes('');
        
        // Invalidate cache for next fetch
        setDataCache(prev => ({ ...prev, lastFetch: null }));
      }
    } catch (error) {
      console.error('Error approving campaign:', error);
      toast.error(error.response?.data?.message || 'Failed to approve campaign');
    } finally {
      setActionLoading(false);
    }
  };

  // Optimized campaign rejection with minimal refetch
  const handleRejectCampaign = async (campaignId) => {
    if (!reviewNotes.trim()) {
      toast.error('Please provide review notes for rejection');
      return;
    }

    setActionLoading(true);
    try {
      const response = await axios.put(`/api/admin/campaigns/${campaignId}/reject`, {
        reviewNotes: reviewNotes.trim()
      });

      if (response.data.success) {
        toast.success('Campaign rejected successfully!');
        
        // Update local state instead of refetching all data
        const updatedCampaign = response.data.data.campaign;
        
        // Remove from pending campaigns
        setPendingCampaigns(prev => prev.filter(c => c._id !== campaignId));
        
        // Update in all campaigns
        setAllCampaigns(prev => prev.map(c => 
          c._id === campaignId ? updatedCampaign : c
        ));
        
        // Update analytics locally
        setAnalytics(prev => ({
          ...prev,
          pendingApprovals: Math.max(0, prev.pendingApprovals - 1)
        }));
        
        setSelectedCampaign(null);
        setReviewNotes('');
        
        // Invalidate cache for next fetch
        setDataCache(prev => ({ ...prev, lastFetch: null }));
      }
    } catch (error) {
      console.error('Error rejecting campaign:', error);
      toast.error(error.response?.data?.message || 'Failed to reject campaign');
    } finally {
      setActionLoading(false);
    }
  };

  // Optimized user management functions with local state updates
  const handleUpdateUserRole = async (userId, newRole) => {
    try {
      await axios.put(`/api/admin/users/${userId}/role`, { role: newRole });
      toast.success('User role updated successfully!');
      
      // Update local state instead of refetching
      setUsers(prev => prev.map(user => 
        user._id === userId ? { ...user, role: newRole } : user
      ));
      
      // Invalidate cache for next fetch
      setDataCache(prev => ({ ...prev, lastFetch: null }));
    } catch (error) {
      console.error('Error updating user role:', error);
      toast.error('Failed to update user role');
    }
  };

  const handleToggleUserStatus = async (userId, isActive) => {
    try {
      await axios.put(`/api/admin/users/${userId}/status`, { isActive: !isActive });
      toast.success(`User ${!isActive ? 'activated' : 'deactivated'} successfully!`);
      
      // Update local state instead of refetching
      setUsers(prev => prev.map(user => 
        user._id === userId ? { ...user, isActive: !isActive } : user
      ));
      
      // Invalidate cache for next fetch
      setDataCache(prev => ({ ...prev, lastFetch: null }));
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error('Failed to update user status');
    }
  };

  // Memoized filtered campaigns to prevent unnecessary recalculations
  const filteredCampaigns = useMemo(() => {
    let filtered = allCampaigns;
    
    if (filterStatus !== 'all') {
      filtered = filtered.filter(campaign => campaign.status === filterStatus);
    }
    
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(campaign => 
        campaign.title?.toLowerCase().includes(term) ||
        campaign.description?.toLowerCase().includes(term) ||
        campaign.creator?.name?.toLowerCase().includes(term)
      );
    }
    
    return filtered;
  }, [allCampaigns, filterStatus, searchTerm]);

  // Handle campaign edit
  const handleEditCampaign = (campaign) => {
    setSelectedCampaign(campaign);
    // You can add edit modal logic here
  };

  // Handle campaign delete
  const handleDeleteCampaign = async (campaignId) => {
    if (window.confirm('Are you sure you want to delete this campaign?')) {
      try {
        await axios.delete(`/api/admin/campaigns/${campaignId}`);
        toast.success('Campaign deleted successfully!');
        
        // Update local state instead of refetching
        setAllCampaigns(prev => prev.filter(c => c._id !== campaignId));
        setPendingCampaigns(prev => prev.filter(c => c._id !== campaignId));
        
        // Update analytics locally
        setAnalytics(prev => ({
          ...prev,
          totalCampaigns: Math.max(0, prev.totalCampaigns - 1)
        }));
        
        // Invalidate cache for next fetch
        setDataCache(prev => ({ ...prev, lastFetch: null }));
      } catch (error) {
        console.error('Error deleting campaign:', error);
        toast.error('Error deleting campaign. Please try again.');
      }
    }
  };

  // Financial report generation function
  const handleGenerateFinancialReport = async () => {
    setReportLoading(true);
    try {
      const response = await axios.get(`/api/admin/reports/financial?period=${reportPeriod}`, {
        responseType: 'blob'
      });
      
      // Create blob link to download PDF
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename with current date
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      link.setAttribute('download', `financial-report-${reportPeriod}-${dateStr}.pdf`);
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success(`${reportPeriod.charAt(0).toUpperCase() + reportPeriod.slice(1)} financial report PDF downloaded successfully!`);
    } catch (error) {
      console.error('Error generating financial report:', error);
      toast.error('Failed to generate financial report. Please try again.');
    } finally {
      setReportLoading(false);
    }
  };

  // Memoized filtered users to prevent unnecessary recalculations
  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) return users;
    
    const term = searchTerm.toLowerCase();
    return users.filter(user => 
      user.name?.toLowerCase().includes(term) ||
      user.email?.toLowerCase().includes(term)
    );
  }, [users, searchTerm]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: FaTachometerAlt },
    { id: 'campaigns', label: 'Campaign Management', icon: FaFileAlt },
    { id: 'users', label: 'User Management', icon: FaUsers },
    { id: 'analytics', label: 'Analytics', icon: FaChartBar },
    { id: 'reports', label: 'Financial Reports', icon: FaDownload },
    { id: 'settings', label: 'Settings', icon: FaCog }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold text-gray-800">Admin Panel</h1>
          <p className="text-sm text-gray-600 mt-1">Welcome, {user?.name}</p>
        </div>
        
        <nav className="mt-6">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center px-6 py-3 text-left hover:bg-blue-50 transition-colors ${
                  activeTab === item.id ? 'bg-blue-100 border-r-4 border-blue-500 text-blue-700' : 'text-gray-700'
                }`}
              >
                <Icon className="mr-3" />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-8">Dashboard Overview</h2>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Campaigns</p>
                    <p className="text-3xl font-bold text-blue-600">{analytics.totalCampaigns}</p>
                  </div>
                  <FaFileAlt className="text-4xl text-blue-500" />
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Users</p>
                    <p className="text-3xl font-bold text-green-600">{analytics.totalUsers}</p>
                  </div>
                  <FaUsers className="text-4xl text-green-500" />
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Pending Approvals</p>
                    <p className="text-3xl font-bold text-orange-600">{analytics.pendingApprovals}</p>
                  </div>
                  <FaClock className="text-4xl text-orange-500" />
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Revenue</p>
                    <p className="text-3xl font-bold text-purple-600">${analytics.totalRevenue?.toLocaleString()}</p>
                  </div>
                  <FaDollarSign className="text-4xl text-purple-500" />
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Active Campaigns</p>
                    <p className="text-3xl font-bold text-indigo-600">{analytics.activeCampaigns}</p>
                  </div>
                  <FaCheckCircle className="text-4xl text-indigo-500" />
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Donations</p>
                    <p className="text-3xl font-bold text-red-600">{analytics.totalDonations}</p>
                  </div>
                  <FaUser className="text-4xl text-red-500" />
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold mb-4">Recent Activity</h3>
              <div className="space-y-4">
                {pendingCampaigns.slice(0, 5).map((campaign) => (
                  <div key={campaign._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{campaign.title}</p>
                      <p className="text-sm text-gray-600">Submitted by {campaign.creator?.name}</p>
                    </div>
                    <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
                      Pending Review
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Campaign Management Tab */}
        {activeTab === 'campaigns' && (
          <div>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold text-gray-800">Campaign Management</h2>
              <div className="flex space-x-4">
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search campaigns..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="active">Active</option>
                  <option value="rejected">Rejected</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            {/* Pending Campaigns Section */}
            {pendingCampaigns.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-4 text-orange-600">
                  <FaExclamationTriangle className="inline mr-2" />
                  Campaigns Awaiting Approval ({pendingCampaigns.length})
                </h3>
                <div className="grid gap-6">
                  {pendingCampaigns.map((campaign) => (
                    <div key={campaign._id} className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold mb-2">{campaign.title}</h4>
                          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                            <div className="flex items-center">
                              <FaUser className="mr-2" />
                              {campaign.creator?.name || 'Unknown'}
                            </div>
                            <div className="flex items-center">
                              <FaDollarSign className="mr-2" />
                              Goal: ${campaign.goalAmount?.toLocaleString()}
                            </div>
                            <div className="flex items-center">
                              <FaCalendarAlt className="mr-2" />
                              Submitted: {new Date(campaign.createdAt).toLocaleDateString()}
                            </div>
                            <div className="flex items-center">
                              <FaMapMarkerAlt className="mr-2" />
                              {campaign.location ? 
                                (typeof campaign.location === 'string' 
                                  ? campaign.location 
                                  : [campaign.location.city, campaign.location.state, campaign.location.country]
                                      .filter(Boolean)
                                      .join(', ')
                                ) : 'Not specified'
                              }
                            </div>
                          </div>
                          <p className="text-gray-700 mb-4">{campaign.description?.substring(0, 200)}...</p>
                        </div>
                        <div className="ml-6 flex flex-col space-y-2">
                          <button
                            onClick={() => setSelectedCampaign(campaign)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                          >
                            <FaEye className="mr-2" /> Review
                          </button>
                          <button
                            onClick={() => handleApproveCampaign(campaign._id)}
                            disabled={actionLoading}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
                          >
                            <FaCheckCircle className="mr-2" /> Approve
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* All Campaigns Table */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold">All Campaigns</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campaign</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Creator</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Goal</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredCampaigns.map((campaign) => (
                      <tr key={campaign._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{campaign.title}</div>
                            <div className="text-sm text-gray-500">{campaign.description?.substring(0, 50)}...</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {campaign.creator?.name || 'Unknown'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${campaign.goalAmount?.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            campaign.status === 'active' ? 'bg-green-100 text-green-800' :
                            campaign.status === 'pending' ? 'bg-orange-100 text-orange-800' :
                            campaign.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {campaign.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(campaign.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => setSelectedCampaign(campaign)}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            <FaEye />
                          </button>
                          <button 
                            onClick={() => handleEditCampaign(campaign)}
                            className="text-gray-600 hover:text-gray-900 mr-3"
                            title="Edit Campaign"
                          >
                            <FaEdit />
                          </button>
                          <button 
                            onClick={() => handleDeleteCampaign(campaign._id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete Campaign"
                          >
                            <FaTrash />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* User Management Tab */}
        {activeTab === 'users' && (
          <div>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold text-gray-800">User Management</h2>
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.map((user) => (
                      <tr key={user._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                <FaUser className="text-gray-600" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{user.name}</div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={user.role}
                            onChange={(e) => handleUpdateUserRole(user._id, e.target.value)}
                            className="text-sm border border-gray-300 rounded px-2 py-1"
                          >
                            <option value="user">User</option>
                            <option value="creator">Creator</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleToggleUserStatus(user._id, user.isActive)}
                            className={`mr-3 ${
                              user.isActive ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'
                            }`}
                          >
                            {user.isActive ? <FaUserTimes /> : <FaUserCheck />}
                          </button>
                          <button className="text-blue-600 hover:text-blue-900">
                            <FaUserShield />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-8">Analytics & Reports</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-4">Campaign Statistics</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Total Campaigns</span>
                    <span className="font-semibold">{analytics.totalCampaigns}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Active Campaigns</span>
                    <span className="font-semibold text-green-600">{analytics.activeCampaigns}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Pending Approval</span>
                    <span className="font-semibold text-orange-600">{analytics.pendingApprovals}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-4">Revenue Analytics</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Total Revenue</span>
                    <span className="font-semibold text-green-600">${analytics.totalRevenue?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Total Donations</span>
                    <span className="font-semibold">{analytics.totalDonations}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Average Donation</span>
                    <span className="font-semibold">${analytics.totalDonations > 0 ? (analytics.totalRevenue / analytics.totalDonations).toFixed(2) : '0'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Financial Reports Tab */}
        {activeTab === 'reports' && (
          <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-8">Financial Reports</h2>
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">Generate Financial Report</h3>
                <p className="text-gray-600 mb-4">
                  Download comprehensive financial reports including donation statistics, revenue breakdown, and campaign performance metrics.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Report Period
                  </label>
                  <select
                    value={reportPeriod}
                    onChange={(e) => setReportPeriod(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="weekly">Weekly Report</option>
                    <option value="monthly">Monthly Report</option>
                    <option value="yearly">Yearly Report</option>
                  </select>
                </div>
                
                <div className="flex items-end">
                  <button
                    onClick={handleGenerateFinancialReport}
                    disabled={reportLoading}
                    className="w-full px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {reportLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Generating...
                      </>
                    ) : (
                      <>
                        <FaDownload className="mr-2" />
                        Download Report
                      </>
                    )}
                  </button>
                </div>
              </div>
              
              <div className="mt-8 border-t pt-6">
                <h4 className="text-md font-semibold mb-4">Report Contents</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h5 className="font-medium text-gray-800 mb-2">Revenue Analytics</h5>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Total revenue for the period</li>
                      <li>• Number of donations</li>
                      <li>• Average donation amount</li>
                      <li>• Daily revenue trends</li>
                    </ul>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h5 className="font-medium text-gray-800 mb-2">Campaign Performance</h5>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Top performing campaigns</li>
                      <li>• Category breakdown</li>
                      <li>• Campaign success rates</li>
                      <li>• Donor demographics</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-8">System Settings</h2>
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Platform Configuration</h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Platform Commission Rate (%)
                  </label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="5"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Campaign Goal ($)
                  </label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="100"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Auto-approve campaigns under ($)
                  </label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="1000"
                  />
                </div>
                
                <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Campaign Review Modal */}
      {selectedCampaign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-2xl font-bold">Campaign Review</h3>
              <button
                onClick={() => setSelectedCampaign(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimesCircle className="text-2xl" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h4 className="text-lg font-semibold mb-4">{selectedCampaign.title}</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center">
                    <FaUser className="mr-2 text-gray-500" />
                    <span>Creator: {selectedCampaign.creator?.name}</span>
                  </div>
                  <div className="flex items-center">
                    <FaDollarSign className="mr-2 text-gray-500" />
                    <span>Goal: ${selectedCampaign.goalAmount?.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center">
                    <FaCalendarAlt className="mr-2 text-gray-500" />
                    <span>Submitted: {new Date(selectedCampaign.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center">
                    <FaMapMarkerAlt className="mr-2 text-gray-500" />
                    <span>Location: {selectedCampaign.location ? 
                      (typeof selectedCampaign.location === 'string' 
                        ? selectedCampaign.location 
                        : [selectedCampaign.location.city, selectedCampaign.location.state, selectedCampaign.location.country]
                            .filter(Boolean)
                            .join(', ')
                      ) : 'Not specified'
                    }</span>
                  </div>
                </div>
                
                <div className="mt-6">
                  <h5 className="font-semibold mb-2">Description</h5>
                  <p className="text-gray-700 text-sm leading-relaxed">{selectedCampaign.description}</p>
                </div>
              </div>
              
              <div>
                <h5 className="font-semibold mb-4">Review Notes</h5>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Add your review notes here..."
                  className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                
                <div className="flex space-x-4 mt-6">
                  <button
                    onClick={() => handleApproveCampaign(selectedCampaign._id)}
                    disabled={actionLoading}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
                  >
                    <FaCheckCircle className="mr-2" />
                    {actionLoading ? 'Processing...' : 'Approve Campaign'}
                  </button>
                  <button
                    onClick={() => handleRejectCampaign(selectedCampaign._id)}
                    disabled={actionLoading}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center"
                  >
                    <FaTimesCircle className="mr-2" />
                    {actionLoading ? 'Processing...' : 'Reject Campaign'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;