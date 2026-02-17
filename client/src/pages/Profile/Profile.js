import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { FaUser, FaEdit, FaSave, FaTimes, FaCamera, FaEnvelope, FaPhone, FaMapMarkerAlt, FaCalendar, FaHeart, FaDollarSign } from 'react-icons/fa';
import axios from '../../axios';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userStats, setUserStats] = useState({
    totalDonations: 0,
    totalCampaigns: 0,
    totalRaised: 0
  });
  
  const [userCampaigns, setUserCampaigns] = useState([]);
  const [userDonations, setUserDonations] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    bio: '',
    location: '',
    dateOfBirth: '',
    avatar: null
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        bio: user.bio || '',
        location: user.location || '',
        dateOfBirth: user.dateOfBirth || '',
        avatar: user.avatar || null
      });
      fetchUserStats();
      fetchUserCampaigns();
      fetchUserDonations();
    }
  }, [user]);

  const fetchUserStats = async () => {
    try {
      const response = await axios.get('/api/users/stats');
      setUserStats(response.data);
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const fetchUserCampaigns = async () => {
    try {
      const response = await axios.get('/api/campaigns/user');
      setUserCampaigns(response.data || []);
    } catch (error) {
      console.error('Error fetching user campaigns:', error);
    }
  };

  const fetchUserDonations = async () => {
    try {
      const response = await axios.get('/api/donations/user');
      setUserDonations(response.data?.made || []);
    } catch (error) {
      console.error('Error fetching user donations:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // Show preview immediately
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          avatar: reader.result
        }));
      };
      reader.readAsDataURL(file);
      
      // Upload to server
      try {
        setLoading(true);
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await axios.post('/api/users/avatar', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        if (response.data.success) {
          // Update user context with new avatar
          updateUser({ ...user, avatar: response.data.data.avatar });
          toast.success('Avatar updated successfully');
        }
      } catch (error) {
        console.error('Error uploading avatar:', error);
        toast.error(error.response?.data?.message || 'Failed to upload avatar');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      // Only send profile data without avatar since avatar is handled separately
      const profileData = { ...formData };
      delete profileData.avatar;
      
      const response = await axios.patch('/api/users/profile', profileData);
      updateUser(response.data.user);
      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAvatar = async () => {
    try {
      setLoading(true);
      const response = await axios.delete('/api/users/avatar');
      
      if (response.data.success) {
        // Update user context with default avatar
        updateUser({ ...user, avatar: response.data.data?.avatar || null });
        // Update form data
        setFormData(prev => ({
          ...prev,
          avatar: null
        }));
        toast.success('Avatar removed successfully');
      }
    } catch (error) {
      console.error('Error deleting avatar:', error);
      toast.error(error.response?.data?.message || 'Failed to remove avatar');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        bio: user.bio || '',
        location: user.location || '',
        dateOfBirth: user.dateOfBirth || '',
        avatar: user.avatar || null
      });
    }
    setIsEditing(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please log in to view your profile</h2>
          <Link to="/login" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8"
        >
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-12 text-white relative">
            <div className="flex items-center space-x-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
                  {formData.avatar ? (
                    <img 
                      src={formData.avatar.url || formData.avatar} 
                      alt="Profile" 
                      className="w-full h-full object-cover" 
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.style.display = 'none';
                        e.target.parentNode.innerHTML = '<div class="w-full h-full bg-gray-200 flex items-center justify-center"><span class="text-gray-500 text-sm">Photo not available</span></div>';
                      }}
                    />
                  ) : (
                    <FaUser className="text-4xl text-white" />
                  )}
                </div>
                {isEditing && (
                  <div className="absolute bottom-0 right-0 flex">
                    <label className="bg-blue-500 rounded-full p-2 cursor-pointer hover:bg-blue-600 transition-colors">
                      <FaCamera className="text-white text-sm" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                    </label>
                    {formData.avatar && (
                      <button 
                        type="button"
                        onClick={handleDeleteAvatar}
                        className="ml-2 bg-red-500 rounded-full p-2 cursor-pointer hover:bg-red-600 transition-colors"
                      >
                        <FaTimes className="text-white text-sm" />
                      </button>
                    )}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">{formData.name}</h1>
                <p className="text-blue-100 mb-4">{formData.email}</p>
                <div className="flex space-x-4">
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                    >
                      <FaEdit />
                      <span>Edit Profile</span>
                    </button>
                  ) : (
                    <div className="flex space-x-2">
                      <button
                        onClick={handleSave}
                        disabled={loading}
                        className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 disabled:opacity-50"
                      >
                        <FaSave />
                        <span>{loading ? 'Saving...' : 'Save'}</span>
                      </button>
                      <button
                        onClick={handleCancel}
                        className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                      >
                        <FaTimes />
                        <span>Cancel</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-xl mb-8"
        >
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-8">
              {[
                { id: 'overview', label: 'Overview', icon: FaUser },
                { id: 'campaigns', label: 'My Campaigns', icon: FaHeart },
                { id: 'donations', label: 'My Donations', icon: FaDollarSign }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="text-sm" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 bg-white rounded-2xl shadow-xl p-8"
          >
            {activeTab === 'overview' && (
              <>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Profile Information</h2>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FaUser className="inline mr-2" />
                    Full Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="px-4 py-3 bg-gray-50 rounded-lg">{formData.name || 'Not provided'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FaEnvelope className="inline mr-2" />
                    Email
                  </label>
                  <p className="px-4 py-3 bg-gray-50 rounded-lg">{formData.email}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FaPhone className="inline mr-2" />
                    Phone
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="px-4 py-3 bg-gray-50 rounded-lg">{formData.phone || 'Not provided'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FaMapMarkerAlt className="inline mr-2" />
                    Location
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="px-4 py-3 bg-gray-50 rounded-lg">{formData.location || 'Not provided'}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FaCalendar className="inline mr-2" />
                    Date of Birth
                  </label>
                  {isEditing ? (
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="px-4 py-3 bg-gray-50 rounded-lg">
                      {formData.dateOfBirth ? new Date(formData.dateOfBirth).toLocaleDateString() : 'Not provided'}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                {isEditing ? (
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Tell us about yourself..."
                  />
                ) : (
                  <p className="px-4 py-3 bg-gray-50 rounded-lg min-h-[100px]">
                    {formData.bio || 'No bio provided'}
                  </p>
                )}
              </div>
            </div>
              </>
            )}

            {activeTab === 'campaigns' && (
              <>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">My Campaigns</h2>
                <div className="space-y-4">
                  {userCampaigns.length > 0 ? (
                    userCampaigns.map((campaign) => (
                      <div key={campaign._id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">{campaign.title}</h3>
                            <p className="text-gray-600 text-sm mb-3 line-clamp-2">{campaign.description}</p>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                campaign.status === 'active' ? 'bg-green-100 text-green-800' :
                                campaign.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {campaign.status}
                              </span>
                              <span>Goal: ${campaign.targetAmount}</span>
                              <span>Raised: ${campaign.currentAmount || 0}</span>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Link
                              to={`/campaigns/${campaign._id}`}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              View
                            </Link>
                            <Link
                              to={`/campaigns/${campaign._id}/edit`}
                              className="text-green-600 hover:text-green-800 text-sm font-medium"
                            >
                              Edit
                            </Link>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{
                              width: `${Math.min((campaign.currentAmount || 0) / campaign.targetAmount * 100, 100)}%`
                            }}
                          ></div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <FaHeart className="mx-auto text-4xl text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns yet</h3>
                      <p className="text-gray-500 mb-4">Start making a difference by creating your first campaign.</p>
                      <Link
                        to="/campaigns/create"
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Create Campaign
                      </Link>
                    </div>
                  )}
                </div>
              </>
            )}

            {activeTab === 'donations' && (
              <>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">My Donations</h2>
                <div className="space-y-4">
                  {userDonations.length > 0 ? (
                    userDonations.map((donation) => (
                      <div key={donation._id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                              {donation.campaign?.title || 'Campaign'}
                            </h3>
                            <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                              <span className="font-medium text-green-600">${donation.amount}</span>
                              <span>{new Date(donation.createdAt).toLocaleDateString()}</span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                donation.status === 'completed' ? 'bg-green-100 text-green-800' :
                                donation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {donation.status}
                              </span>
                            </div>
                            {donation.message && (
                              <p className="text-gray-600 text-sm italic">"{donation.message}"</p>
                            )}
                          </div>
                          <div>
                            <Link
                              to={`/campaigns/${donation.campaign?._id}`}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              View Campaign
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <FaDollarSign className="mx-auto text-4xl text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No donations yet</h3>
                      <p className="text-gray-500 mb-4">Support amazing causes by making your first donation.</p>
                      <Link
                        to="/campaigns"
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Browse Campaigns
                      </Link>
                    </div>
                  )}
                </div>
              </>
            )}
          </motion.div>

          {/* Stats Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {/* Stats Cards */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Your Impact</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FaDollarSign className="text-green-600 text-xl" />
                    <div>
                      <p className="text-sm text-gray-600">Total Donated</p>
                      <p className="text-lg font-bold text-green-600">${userStats.totalDonations}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FaHeart className="text-blue-600 text-xl" />
                    <div>
                      <p className="text-sm text-gray-600">Campaigns Created</p>
                      <p className="text-lg font-bold text-blue-600">{userStats.totalCampaigns}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FaDollarSign className="text-purple-600 text-xl" />
                    <div>
                      <p className="text-sm text-gray-600">Total Raised</p>
                      <p className="text-lg font-bold text-purple-600">${userStats.totalRaised}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  to="/campaigns/create"
                  className="block w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white text-center py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105"
                >
                  Create Campaign
                </Link>
                <Link
                  to="/campaigns"
                  className="block w-full bg-gray-100 text-gray-700 text-center py-3 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Browse Campaigns
                </Link>
                <Link
                  to="/dashboard"
                  className="block w-full bg-gray-100 text-gray-700 text-center py-3 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  View Dashboard
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Profile;