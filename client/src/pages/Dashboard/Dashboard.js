import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Tab } from '@headlessui/react';
import { 
  FaChartLine, FaHandHoldingUsd, FaRegListAlt, FaBell, 
  FaCog, FaPlus, FaEdit, FaTrash, FaEye, FaExclamationTriangle,
  FaRegCheckCircle, FaUserCircle, FaShieldAlt, FaNewspaper,
  FaCheckCircle
} from 'react-icons/fa';
// import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import axios from '../../axios';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import CampaignCard from '../../components/Campaign/CampaignCard';
import DonationCard from '../../components/Donation/DonationCard';
import NotificationItem from '../../components/Notification/NotificationItem';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import CampaignUpdateForm from '../../components/Campaign/CampaignUpdateForm';
import Chart from 'chart.js/auto';

const Dashboard = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalDonationsReceived: 0,
    totalDonationsMade: 0,
    campaignsCreated: 0,
    campaignsFunded: 0,
    totalRaised: 0,
    successRate: 0
  });
  const [campaigns, setCampaigns] = useState({
    active: [],
    completed: [],
    drafts: []
  });
  const [donations, setDonations] = useState({
    made: [],
    received: []
  });
  const [notifications, setNotifications] = useState([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState('');
  const [accountSettings, setAccountSettings] = useState({
    name: user?.name || '',
    email: user?.email || '',
    bio: user?.bio || '',
    twoFactorEnabled: user?.twoFactorEnabled || false
  });
  const [donationChartInstance, setDonationChartInstance] = useState(null);
  const [analyticsChartInstance, setAnalyticsChartInstance] = useState(null);
  const donationChartRef = useRef(null);
  const analyticsChartRef = useRef(null);

  // Helper function to generate monthly data for charts
  const generateMonthlyData = useCallback((data) => {
    const months = Array(12).fill(0);
    
    if (!data || !Array.isArray(data)) return months;
    
    data.forEach(item => {
      if (item.createdAt) {
        const date = new Date(item.createdAt);
        const month = date.getMonth();
        const amount = parseFloat(item.amount) || 0;
        months[month] += amount;
      }
    });
    
    return months;
  }, []);

  // Initialize donation chart
  const initializeDonationChart = useCallback(() => {
    // Get the canvas element
    const ctx = document.getElementById('donationChart');
    if (!ctx) {
      console.warn('Donation chart canvas element not found');
      return;
    }
    
    // Destroy existing chart if it exists
    if (donationChartInstance) {
      try {
        donationChartInstance.destroy();
        setDonationChartInstance(null);
      } catch (error) {
        console.warn('Error destroying existing donation chart:', error);
      }
    }
    
    // Also check for any existing Chart.js instance on this canvas
    const existingChart = Chart.getChart(ctx);
    if (existingChart) {
      try {
        existingChart.destroy();
      } catch (error) {
        console.warn('Error destroying existing Chart.js instance:', error);
      }
    }
    
    try {
        // Create new chart instance
        const newChart = new Chart(ctx, {
          type: 'line',
          data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            datasets: [
              {
                label: 'Donations Received',
                data: generateMonthlyData(donations.received),
                borderColor: 'rgba(59, 130, 246, 1)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.4,
                fill: true
              },
              {
                label: 'Donations Made',
                data: generateMonthlyData(donations.made),
                borderColor: 'rgba(139, 92, 246, 1)',
                backgroundColor: 'rgba(139, 92, 246, 0.1)',
                tension: 0.4,
                fill: true
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'top',
              },
              tooltip: {
                mode: 'index',
                intersect: false,
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                grid: {
                  color: 'rgba(0, 0, 0, 0.05)'
                }
              },
              x: {
                grid: {
                  display: false
                }
              }
            }
          }
        });
        
        donationChartRef.current = newChart;
        
        setDonationChartInstance(newChart);
      } catch (error) {
        console.error('Error initializing donation chart:', error);
      }
  }, [donations.received, donations.made, generateMonthlyData, donationChartInstance]);

  // Initialize analytics chart
  const initializeAnalyticsChart = useCallback(() => {
    // Get the canvas element
    const ctx = document.getElementById('analyticsChart');
    if (!ctx) {
      console.warn('Analytics chart canvas element not found');
      return;
    }
    
    // Destroy existing chart if it exists
    if (analyticsChartInstance) {
      try {
        analyticsChartInstance.destroy();
        setAnalyticsChartInstance(null);
      } catch (error) {
        console.warn('Error destroying existing analytics chart:', error);
      }
    }
    
    // Also check for any existing Chart.js instance on this canvas
    const existingChart = Chart.getChart(ctx);
    if (existingChart) {
      try {
        existingChart.destroy();
      } catch (error) {
        console.warn('Error destroying existing Chart.js instance:', error);
      }
    }
    
    try {
        // Create new chart instance
        const newChart = new Chart(ctx, {
          type: 'line',
          data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            datasets: [
              {
                label: 'Donations Received ($)',
                data: generateMonthlyData(donations.received),
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.1)',
                tension: 0.4,
                fill: true
              },
              {
                label: 'Donations Made ($)',
                data: generateMonthlyData(donations.made),
                borderColor: 'rgb(153, 102, 255)',
                backgroundColor: 'rgba(153, 102, 255, 0.1)',
                tension: 0.4,
                fill: true
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'top',
              },
              title: {
                display: true,
                text: 'Donation Activity'
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                grid: {
                  color: 'rgba(0, 0, 0, 0.05)'
                }
              },
              x: {
                grid: {
                  display: false
                }
              }
            }
          }
        });
        
        analyticsChartRef.current = newChart;
        setAnalyticsChartInstance(newChart);
      } catch (error) {
        console.error('Error initializing analytics chart:', error);
      }
  }, [donations.received, donations.made, generateMonthlyData, analyticsChartInstance]);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch all data in parallel using Promise.all
        const [
          statsResponse, 
          campaignsResponse, 
          donationsResponse, 
          notificationsResponse
        ] = await Promise.all([
          axios.get('/api/users/stats').catch(err => {
            console.error('Stats fetch error:', err);
            return { data: {
              totalDonationsReceived: 0,
              totalDonationsMade: 0,
              campaignsCreated: 0,
              campaignsFunded: 0,
              totalRaised: 0,
              successRate: 0
            }};
          }),
          axios.get('/api/campaigns/user').catch(err => {
            console.error('Campaigns fetch error:', err);
            return { data: [] };
          }),
          axios.get('/api/donations/user').catch(err => {
            console.error('Donations fetch error:', err);
            return { data: { made: [], received: [] }};
          }),
          axios.get('/api/notifications').catch(err => {
            console.error('Notifications fetch error:', err);
            return { data: [] };
          })
        ]);
        
        // Set state with fetched data
        setStats(statsResponse.data || {
          totalDonationsReceived: 0,
          totalDonationsMade: 0,
          campaignsCreated: 0,
          campaignsFunded: 0,
          totalRaised: 0,
          successRate: 0
        });
        
        // Handle different response structures
        let campaignsData;
        if (campaignsResponse.data && campaignsResponse.data.data && Array.isArray(campaignsResponse.data.data.campaigns)) {
          campaignsData = campaignsResponse.data.data.campaigns;
        } else if (Array.isArray(campaignsResponse.data)) {
          campaignsData = campaignsResponse.data;
        } else if (campaignsResponse.data && Array.isArray(campaignsResponse.data.campaigns)) {
          campaignsData = campaignsResponse.data.campaigns;
        } else {
          campaignsData = [];
        }
        
        setCampaigns({
          active: campaignsData.filter(c => c.status === 'active'),
          completed: campaignsData.filter(c => ['completed', 'successful', 'expired'].includes(c.status)),
          drafts: campaignsData.filter(c => c.status === 'draft')
        });
        
        setDonations({
          made: donationsResponse.data?.made || [],
          received: donationsResponse.data?.received || []
        });
        
        setNotifications(notificationsResponse.data || []);
        
        // Charts will be initialized by individual useEffect hooks
        
      } catch (error) {
        toast.error('Failed to load dashboard data. Please try again later.');
        console.error('Dashboard data fetch error:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);
  
  // Helper function is already defined as useCallback above
  // Removing duplicate declaration
    
  // Rest of duplicate function removed

  // Setup socket listeners for real-time updates
  useEffect(() => {
    if (socket && socket.connected) {
      // Listen for new donations to user's campaigns
      socket.on('new-donation', (payload) => {
        const donation = payload?.donation || payload;
        const campaignUpdate = payload?.campaign;

        if (donation) {
          setDonations(prev => ({
            ...prev,
            received: [donation, ...(prev.received || [])]
          }));

          toast.success(`New donation received: $${donation.amount}`);
        }

        if (campaignUpdate && campaignUpdate._id) {
          setCampaigns(prev => {
            const newCampaigns = { ...prev };

            Object.keys(newCampaigns).forEach(key => {
              newCampaigns[key] = (newCampaigns[key] || []).filter(c => c._id !== campaignUpdate._id);
            });

            if (campaignUpdate.status === 'active') {
              newCampaigns.active = [campaignUpdate, ...(newCampaigns.active || [])];
            } else if (['completed', 'successful', 'expired'].includes(campaignUpdate.status)) {
              newCampaigns.completed = [campaignUpdate, ...(newCampaigns.completed || [])];
            } else if (campaignUpdate.status === 'draft') {
              newCampaigns.drafts = [campaignUpdate, ...(newCampaigns.drafts || [])];
            }

            return newCampaigns;
          });
        }
      });
      
      // Listen for new notifications
      socket.on('new-notification', (notification) => {
        setNotifications(prev => [notification, ...(prev || [])]);
        
        let icon = '🔔';
        switch (notification.type) {
          case 'donation_received':
          case 'donation_completed':
            icon = '💰';
            break;
          case 'comment_received':
          case 'comment_replied':
            icon = '💬';
            break;
          case 'campaign_update':
          case 'campaign_approved':
          case 'campaign_rejected':
            icon = '📢';
            break;
          default:
            icon = '🔔';
        }
        
        toast(`${notification.title || notification.message}`, {
          icon: icon,
          duration: 5000,
          onClick: () => {
            setActiveTab(3);
          }
        });
      });
      
      // Listen for campaign status updates
      socket.on('campaign-update', (data) => {
        const updatedCampaign = data?.campaign || data;

        if (!updatedCampaign || !updatedCampaign._id) return;

        setCampaigns(prev => {
          const newCampaigns = { ...prev };
          
          Object.keys(newCampaigns).forEach(key => {
            newCampaigns[key] = (newCampaigns[key] || []).filter(c => c._id !== updatedCampaign._id);
          });
          
          if (updatedCampaign.status === 'active') {
            newCampaigns.active = [updatedCampaign, ...(newCampaigns.active || [])];
          } else if (['completed', 'successful', 'expired'].includes(updatedCampaign.status)) {
            newCampaigns.completed = [updatedCampaign, ...(newCampaigns.completed || [])];
          } else if (updatedCampaign.status === 'draft') {
            newCampaigns.drafts = [updatedCampaign, ...(newCampaigns.drafts || [])];
          }
          
          return newCampaigns;
        });
      });
    }
    
    return () => {
      if (socket) {
        socket.off('new-donation');
        socket.off('new-notification');
        socket.off('campaign-update');
      }
    };
  }, [socket, setActiveTab]);
  
  // Initialize charts when data is loaded
  useEffect(() => {
    if (donations.received && donations.made && !isLoading) {
      // Add a small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        try {
          // Always initialize donation chart as it's always visible
          if (document.getElementById('donationChart')) {
            initializeDonationChart();
          }
        } catch (error) {
          console.error('Chart initialization error:', error);
        }
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [donations.received, donations.made, isLoading, initializeDonationChart]);

  // Handle analytics chart when switching tabs
  useEffect(() => {
    if (donations.received && donations.made && !isLoading) {
      if (activeTab === 0) {
        // Only initialize if not already initialized
        if (!analyticsChartInstance && document.getElementById('analyticsChart')) {
          const timer = setTimeout(() => {
            initializeAnalyticsChart();
          }, 100);
          return () => clearTimeout(timer);
        }
      } else {
        // Destroy analytics chart when leaving Overview tab
        if (analyticsChartInstance) {
          try {
            analyticsChartInstance.destroy();
            setAnalyticsChartInstance(null);
          } catch (error) {
            console.warn('Error destroying analytics chart:', error);
          }
        }
      }
    }
  }, [activeTab, analyticsChartInstance, donations.received, donations.made, isLoading, initializeAnalyticsChart]);

  // Cleanup charts on unmount
  useEffect(() => {
    return () => {
      if (donationChartInstance) {
        try {
          donationChartInstance.destroy();
          donationChartRef.current = null;
        } catch (error) {
          console.warn('Error destroying donation chart on unmount:', error);
        }
      }
      if (analyticsChartInstance) {
        try {
          analyticsChartInstance.destroy();
          analyticsChartRef.current = null;
        } catch (error) {
          console.warn('Error destroying analytics chart on unmount:', error);
        }
      }
    };
  }, [donationChartInstance, analyticsChartInstance]);
  
  // Handle campaign deletion
  const handleDeleteCampaign = async (campaignId) => {
    if (window.confirm('Are you sure you want to delete this campaign? This action cannot be undone.')) {
      try {
        await axios.delete(`/campaigns/${campaignId}`);
        
        // Update local state
        setCampaigns(prev => {
          const newCampaigns = { ...prev };
          Object.keys(newCampaigns).forEach(key => {
            newCampaigns[key] = newCampaigns[key].filter(c => c._id !== campaignId);
          });
          return newCampaigns;
        });
        
        toast.success('Campaign deleted successfully');
      } catch (error) {
        toast.error('Failed to delete campaign');
        console.error('Campaign deletion error:', error);
      }
    }
  };
  
  // Handle notification marking as read
  const handleMarkNotificationAsRead = async (notificationId) => {
    try {
      await axios.put(`/api/notifications/${notificationId}/read`);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification._id === notificationId 
            ? { ...notification, isRead: true } 
            : notification
        )
      );
    } catch (error) {
      console.error('Mark notification as read error:', error);
    }
  };
  
  // Get auth context
  const { setUser } = useAuth();
  
  // Handle account settings update
  const handleUpdateAccountSettings = async (e) => {
    e.preventDefault();
    
    try {
      await axios.patch('/api/users/profile', {
        name: accountSettings.name,
        bio: accountSettings.bio
      });
      
      // Update user context with new data
      setUser(prev => ({ ...prev, name: accountSettings.name, bio: accountSettings.bio }));
      
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
      console.error('Profile update error:', error);
    }
  };
  
  // Handle 2FA toggle
  const handleToggle2FA = async () => {
    try {
      if (accountSettings.twoFactorEnabled) {
        // Disable 2FA
        await axios.post('/api/auth/2fa/disable');
        setAccountSettings(prev => ({ ...prev, twoFactorEnabled: false }));
        toast.success('Two-factor authentication disabled');
      } else {
        // Navigate to 2FA setup page
        navigate('/profile/2fa-setup');
      }
    } catch (error) {
      toast.error('Failed to update two-factor authentication');
      console.error('2FA toggle error:', error);
    }
  };
  
  // Canvas for donation chart visualization
  useEffect(() => {
    // Only run when not loading and on the first tab
    if (!isLoading && activeTab === 0) {
      const donationChartCanvas = document.getElementById('donationChart');
      if (donationChartCanvas) {
        // Charts will be initialized by individual useEffect hooks
      }
    }
  }, [isLoading, activeTab]);
  
  // Render loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="large" text="Loading dashboard..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-4 sm:p-6 mb-4 sm:mb-8 shadow-lg">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-white mb-4 md:mb-0">
              <h1 className="text-2xl sm:text-3xl font-bold">Welcome back, {user?.name || 'User'}!</h1>
              <p className="mt-1 sm:mt-2 text-blue-100 text-sm sm:text-base">Here's what's happening with your campaigns and donations.</p>
            </div>
            <Link 
              to="/campaigns/create" 
              className="bg-white text-blue-600 hover:bg-blue-50 px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-all transform hover:scale-105 shadow-md flex items-center text-sm sm:text-base"
            >
              <FaPlus className="mr-2" /> Start a Campaign
            </Link>
          </div>
        </div>
        
        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-4 sm:mb-8">
          <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Raised</p>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900">${(stats.totalRaised || 0).toFixed(2)}</h3>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <FaHandHoldingUsd className="text-blue-500 text-xl" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Campaigns Created</p>
                <h3 className="text-2xl font-bold text-gray-900">{stats.campaignsCreated}</h3>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <FaRegListAlt className="text-purple-500 text-xl" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Campaigns Funded</p>
                <h3 className="text-2xl font-bold text-gray-900">{stats.campaignsFunded}</h3>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <FaRegCheckCircle className="text-green-500 text-xl" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Success Rate</p>
                <h3 className="text-2xl font-bold text-gray-900">{stats.successRate}%</h3>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg">
                <FaChartLine className="text-yellow-500 text-xl" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Donation Chart */}
        <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-gray-100 mb-4 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-4">Donation Activity</h2>
          <div className="h-60 sm:h-80">
            <canvas id="donationChart"></canvas>
          </div>
        </div>
        
        {/* Main Content Tabs */}
        <Tab.Group selectedIndex={activeTab} onChange={setActiveTab}>
          <Tab.List className="flex flex-wrap sm:flex-nowrap p-1 space-x-0 sm:space-x-1 space-y-1 sm:space-y-0 bg-white rounded-xl shadow mb-4 sm:mb-6">
            <Tab
              className={({ selected }) =>
                `w-full py-2 sm:py-3 text-xs sm:text-sm leading-5 font-medium rounded-lg flex items-center justify-center
                 ${selected ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:bg-gray-100'}`
              }
            >
              <FaChartLine className="mr-2" /> Overview
            </Tab>
            <Tab
              className={({ selected }) =>
                `w-full py-3 text-sm leading-5 font-medium rounded-lg flex items-center justify-center
                 ${selected ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:bg-gray-100'}`
              }
            >
              <FaRegListAlt className="mr-2" /> My Campaigns
            </Tab>
            <Tab
              className={({ selected }) =>
                `w-full py-3 text-sm leading-5 font-medium rounded-lg flex items-center justify-center
                 ${selected ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:bg-gray-100'}`
              }
            >
              <FaHandHoldingUsd className="mr-2" /> Donations
            </Tab>
            <Tab
              className={({ selected }) =>
                `w-full py-3 text-sm leading-5 font-medium rounded-lg flex items-center justify-center
                 ${selected ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:bg-gray-100'}`
              }
            >
              <FaBell className="mr-2" /> Notifications
            </Tab>
            <Tab
              className={({ selected }) =>
                `w-full py-3 text-sm leading-5 font-medium rounded-lg flex items-center justify-center
                 ${selected ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:bg-gray-100'}`
              }
            >
              <FaCog className="mr-2" /> Settings
            </Tab>
          </Tab.List>
          
          <Tab.Panels className="mt-2">
            {/* Overview Panel */}
            <Tab.Panel>
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">Activity Overview</h2>
                <div className="h-64">
                  <canvas id="analyticsChart"></canvas>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Recent Campaigns</h3>
                    <Link to="/dashboard/campaigns" className="text-primary-600 hover:text-primary-800 text-sm font-medium">
                      View all
                    </Link>
                  </div>
                  
                  {campaigns.active.length > 0 ? (
                    <div className="space-y-4">
                      {campaigns.active.slice(0, 3).map(campaign => (
                        <div key={campaign._id} className="flex items-center p-3 border rounded-lg hover:bg-gray-50">
                          <div className="w-12 h-12 rounded-md bg-gray-200 mr-4 overflow-hidden">
                            {campaign.images && campaign.images[0] && campaign.images[0].url ? (
                              <img src={campaign.images[0].url} alt={campaign.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gray-300">
                                <FaRegListAlt className="text-gray-500" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 truncate">{campaign.title}</h4>
                            <div className="flex items-center text-sm text-gray-500">
                              <span className="mr-3">${campaign.currentAmount} raised</span>
                              <span>{Math.round((campaign.currentAmount / campaign.targetAmount) * 100)}%</span>
                            </div>
                          </div>
                          <Link to={`/campaigns/${campaign._id}`} className="text-primary-600 hover:text-primary-800">
                            <FaEye />
                          </Link>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500 mb-4">You haven't created any campaigns yet</p>
                      <Link to="/campaigns/create" className="btn-primary">
                        <FaPlus className="mr-2" /> Create Campaign
                      </Link>
                    </div>
                  )}
                </div>
                
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Recent Donations</h3>
                    <Link to="/dashboard/donations" className="text-primary-600 hover:text-primary-800 text-sm font-medium">
                      View all
                    </Link>
                  </div>
                  
                  {donations.received.length > 0 ? (
                    <div className="space-y-4">
                      {donations.received.slice(0, 3).map(donation => (
                        <div key={donation._id} className="flex items-center p-3 border rounded-lg hover:bg-gray-50">
                          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mr-4">
                            <FaHandHoldingUsd className="text-green-600" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">
                              {donation.anonymous ? 'Anonymous' : donation.donor?.name || 'Unknown'}
                            </h4>
                            <p className="text-sm text-gray-500">
                              Donated ${donation.amount} to {donation.campaign?.title || 'your campaign'}
                            </p>
                          </div>
                          <span className="text-sm text-gray-500">
                            {new Date(donation.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No donations received yet</p>
                    </div>
                  )}
                </div>
              </div>
            </Tab.Panel>
            
            {/* My Campaigns Panel */}
            <Tab.Panel>
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">My Campaigns</h2>
                  <Link to="/campaigns/create" className="btn-primary">
                    <FaPlus className="mr-2" /> Create Campaign
                  </Link>
                </div>
                
                <Tab.Group>
                  <Tab.List className="flex border-b mb-6">
                    <Tab
                      className={({ selected }) =>
                        `px-4 py-2 text-sm font-medium border-b-2 ${selected ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`
                      }
                    >
                      Active ({campaigns.active.length})
                    </Tab>
                    <Tab
                      className={({ selected }) =>
                        `px-4 py-2 text-sm font-medium border-b-2 ${selected ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`
                      }
                    >
                      Completed ({campaigns.completed.length})
                    </Tab>
                    <Tab
                      className={({ selected }) =>
                        `px-4 py-2 text-sm font-medium border-b-2 ${selected ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`
                      }
                    >
                      Drafts ({campaigns.drafts.length})
                    </Tab>
                  </Tab.List>
                  
                  <Tab.Panels>
                    {/* Active Campaigns */}
                    <Tab.Panel>
                      {campaigns.active.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {campaigns.active.map(campaign => (
                            <div key={campaign._id} className="relative">
                              <CampaignCard campaign={campaign} />
                              <div className="absolute top-2 right-2 flex space-x-2">
                                <Link 
                                  to={`/campaigns/${campaign._id}/edit`}
                                  className="p-2 bg-white rounded-full shadow hover:bg-gray-100"
                                  title="Edit Campaign"
                                >
                                  <FaEdit className="text-gray-600" />
                                </Link>
                                <button
                                  onClick={() => handleDeleteCampaign(campaign._id)}
                                  className="p-2 bg-white rounded-full shadow hover:bg-gray-100"
                                  title="Delete Campaign"
                                >
                                  <FaTrash className="text-red-600" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-gray-500 mb-4">You don't have any active campaigns</p>
                          <Link to="/campaigns/create" className="btn-primary">
                            <FaPlus className="mr-2" /> Create Campaign
                          </Link>
                        </div>
                      )}
                    </Tab.Panel>
                    
                    {/* Completed Campaigns */}
                    <Tab.Panel>
                      {campaigns.completed.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {campaigns.completed.map(campaign => (
                            <div key={campaign._id} className="relative">
                              <CampaignCard campaign={campaign} />
                              <div className="absolute top-2 right-2">
                                <div className={`p-2 rounded-full shadow ${campaign.status === 'successful' ? 'bg-green-100' : 'bg-yellow-100'}`}>
                                  {campaign.status === 'successful' ? (
                                    <FaCheckCircle className="text-green-600" title="Campaign Successful" />
                                  ) : (
                                    <FaExclamationTriangle className="text-yellow-600" title="Campaign Expired" />
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-gray-500">You don't have any completed campaigns</p>
                        </div>
                      )}
                    </Tab.Panel>
                    
                    {/* Draft Campaigns */}
                    <Tab.Panel>
                      {campaigns.drafts.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {campaigns.drafts.map(campaign => (
                            <div key={campaign._id} className="relative bg-white rounded-lg shadow overflow-hidden border border-gray-200">
                              <div className="p-4">
                                <h3 className="text-lg font-medium text-gray-900 mb-1">{campaign.title || 'Untitled Campaign'}</h3>
                                <p className="text-sm text-gray-500 mb-4">
                                  Last edited: {new Date(campaign.updatedAt).toLocaleDateString()}
                                </p>
                                <div className="flex space-x-2">
                                  <Link 
                                    to={`/campaigns/${campaign._id}/edit`}
                                    className="btn-primary flex-1 flex items-center justify-center"
                                  >
                                    <FaEdit className="mr-2" /> Continue Editing
                                  </Link>
                                  <button
                                    onClick={() => handleDeleteCampaign(campaign._id)}
                                    className="p-2 bg-red-100 rounded hover:bg-red-200"
                                    title="Delete Draft"
                                  >
                                    <FaTrash className="text-red-600" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-gray-500 mb-4">You don't have any draft campaigns</p>
                          <Link to="/campaigns/create" className="btn-primary">
                            <FaPlus className="mr-2" /> Create Campaign
                          </Link>
                        </div>
                      )}
                    </Tab.Panel>
                  </Tab.Panels>
                </Tab.Group>
              </div>
            </Tab.Panel>
            
            {/* Donations Panel */}
            <Tab.Panel>
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-xl font-semibold mb-6">Donations</h2>
                
                <Tab.Group>
                  <Tab.List className="flex border-b mb-6">
            <Tab
              className={({ selected }) =>
                `px-4 py-2 text-sm font-medium border-b-2 ${selected ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`
              }
            >
              Received ({donations.received.length})
            </Tab>
            <Tab
              className={({ selected }) =>
                `px-4 py-2 text-sm font-medium border-b-2 ${selected ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`
              }
            >
              Made ({donations.made.length})
            </Tab>
            <Tab
              className={({ selected }) =>
                `px-4 py-2 text-sm font-medium border-b-2 ${selected ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`
              }
            >
              Updates
            </Tab>
                  </Tab.List>
                  
                  <Tab.Panels>
                    {/* Received Donations */}
                    <Tab.Panel>
                      {donations.received.length > 0 ? (
                        <div className="space-y-4">
                          {donations.received.map(donation => (
                            <DonationCard key={donation._id} donation={donation} type="received" />
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-gray-500">You haven't received any donations yet</p>
                        </div>
                      )}
                    </Tab.Panel>
                    
                    {/* Made Donations */}
                    <Tab.Panel>
                      {donations.made.length > 0 ? (
                        <div className="space-y-4">
                          {donations.made.map(donation => (
                            <DonationCard key={donation._id} donation={donation} type="made" />
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-gray-500 mb-4">You haven't made any donations yet</p>
                          <Link to="/campaigns" className="btn-primary">
                            Explore Campaigns
                          </Link>
                        </div>
                      )}
                    </Tab.Panel>
                    
                    {/* Campaign Updates */}
                    <Tab.Panel>
                      {campaigns.active.length > 0 ? (
                        <div className="space-y-6">
                          <div className="bg-white rounded-lg shadow-md p-4">
                            <h3 className="text-lg font-semibold mb-4">Select Campaign to Update</h3>
                            <select 
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                              onChange={(e) => setSelectedCampaignId(e.target.value)}
                              value={selectedCampaignId || ''}
                            >
                              <option value="">Select a campaign</option>
                              {campaigns.active.map(campaign => (
                                <option key={campaign._id} value={campaign._id}>
                                  {campaign.title}
                                </option>
                              ))}
                            </select>
                          </div>
                          
                          {selectedCampaignId && (
                            <CampaignUpdateForm 
                              campaignId={selectedCampaignId}
                              onUpdateAdded={() => {
                                toast.success('Update posted successfully!');
                              }}
                            />
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <FaNewspaper className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No Campaigns to Update</h3>
                          <p className="text-gray-500 mb-4">You need to create a campaign before you can post updates.</p>
                          <Link to="/campaigns/create" className="btn-primary">
                            Create Campaign
                          </Link>
                        </div>
                      )}
                    </Tab.Panel>
                  </Tab.Panels>
                </Tab.Group>
              </div>
            </Tab.Panel>
            
            {/* Notifications Panel */}
            <Tab.Panel>
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-6">Notifications</h2>
                
                {notifications.length > 0 ? (
                  <div className="space-y-4">
                    {notifications.map(notification => (
                      <NotificationItem 
                        key={notification._id} 
                        notification={notification} 
                        onMarkAsRead={handleMarkNotificationAsRead}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
                      <FaBell className="h-6 w-6 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No notifications</h3>
                    <p className="text-gray-500">You're all caught up!</p>
                  </div>
                )}
              </div>
            </Tab.Panel>
            
            {/* Settings Panel */}
            <Tab.Panel>
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-6">Account Settings</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2">
                    <form onSubmit={handleUpdateAccountSettings}>
                      <div className="space-y-6">
                        <div>
                          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                            Full Name
                          </label>
                          <input
                            type="text"
                            id="name"
                            value={accountSettings.name}
                            onChange={(e) => setAccountSettings({ ...accountSettings, name: e.target.value })}
                            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                            Email Address
                          </label>
                          <input
                            type="email"
                            id="email"
                            value={accountSettings.email}
                            disabled
                            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 bg-gray-50 text-gray-500 sm:text-sm"
                          />
                          <p className="mt-1 text-xs text-gray-500">Email address cannot be changed</p>
                        </div>
                        
                        <div>
                          <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                            Bio
                          </label>
                          <textarea
                            id="bio"
                            rows="4"
                            value={accountSettings.bio}
                            onChange={(e) => setAccountSettings({ ...accountSettings, bio: e.target.value })}
                            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                            placeholder="Tell others about yourself..."
                          ></textarea>
                        </div>
                        
                        <div>
                          <button
                            type="submit"
                            className="btn-primary w-full"
                          >
                            Save Changes
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>
                  
                  <div>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                        <FaUserCircle className="mr-2" /> Account
                      </h3>
                      <div className="space-y-4">
                        <Link to="/profile" className="block text-sm text-primary-600 hover:text-primary-800">
                          View Public Profile
                        </Link>
                        <Link to="/profile/password" className="block text-sm text-primary-600 hover:text-primary-800">
                          Change Password
                        </Link>
                        <Link to="/profile/verification" className="block text-sm text-primary-600 hover:text-primary-800">
                          Identity Verification
                        </Link>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                        <FaShieldAlt className="mr-2" /> Security
                      </h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">Two-Factor Authentication</p>
                            <p className="text-xs text-gray-500">{accountSettings.twoFactorEnabled ? 'Enabled' : 'Disabled'}</p>
                          </div>
                          <button
                            onClick={handleToggle2FA}
                            className={`px-3 py-1 rounded text-sm font-medium ${accountSettings.twoFactorEnabled ? 'bg-red-100 text-red-800 hover:bg-red-200' : 'bg-green-100 text-green-800 hover:bg-green-200'}`}
                          >
                            {accountSettings.twoFactorEnabled ? 'Disable' : 'Enable'}
                          </button>
                        </div>
                        <Link to="/profile/sessions" className="block text-sm text-primary-600 hover:text-primary-800">
                          Active Sessions
                        </Link>
                        <Link to="/profile/activity" className="block text-sm text-primary-600 hover:text-primary-800">
                          Account Activity
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  );
};

export default Dashboard;
