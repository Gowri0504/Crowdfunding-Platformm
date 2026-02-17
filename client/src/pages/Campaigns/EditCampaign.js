

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { campaignsAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { 
  FaSave, 
  FaTimes, 
  FaImage, 
  FaCalendarAlt,
  FaDollarSign,
  FaTag,
  FaFileAlt,
  FaArrowLeft
} from 'react-icons/fa';

const EditCampaign = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [campaign, setCampaign] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    goalAmount: '',
    endDate: '',
    category: '',
    image: null,
    imagePreview: null
  });

  const categories = [
    'Medical',
    'Education',
    'Emergency',
    'Community',
    'Animals',
    'Environment',
    'Sports',
    'Technology',
    'Arts',
    'Other'
  ];

  useEffect(() => {
    fetchCampaign();
  }, [id]);

  const fetchCampaign = async () => {
    try {
      const response = await campaignsAPI.getCampaign(id);
      // Server sends: { success: true, message, data: { campaign, stats, recentDonations, commentsCount } }
      let campaignData;
      
      if (response.data && response.data.data && response.data.data.campaign) {
        campaignData = response.data.data.campaign;
      } else {
        throw new Error('Invalid campaign data structure');
      }
      
      // Check if user owns this campaign
      if (campaignData.creator._id !== user?.id) {
        toast.error('You can only edit your own campaigns');
        navigate('/dashboard');
        return;
      }
      
      setCampaign(campaignData);
      setFormData({
        title: campaignData.title,
        description: campaignData.description,
        goalAmount: campaignData.goalAmount.toString(),
        endDate: new Date(campaignData.endDate).toISOString().split('T')[0],
        category: campaignData.category,
        image: null,
        imagePreview: campaignData.image || ''
      });
    } catch (error) {
      toast.error('Campaign not found');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Image size should be less than 5MB');
        return;
      }
      
      setFormData(prev => ({
        ...prev,
        image: file,
        imagePreview: URL.createObjectURL(file)
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Campaign title is required');
      return;
    }
    
    if (!formData.description.trim()) {
      toast.error('Campaign description is required');
      return;
    }
    
    if (!formData.goalAmount || parseFloat(formData.goalAmount) <= 0) {
      toast.error('Please enter a valid goal amount');
      return;
    }
    
    if (!formData.endDate) {
      toast.error('End date is required');
      return;
    }
    
    if (new Date(formData.endDate) <= new Date()) {
      toast.error('End date must be in the future');
      return;
    }

    try {
      setSaving(true);
      
      const updateData = new FormData();
      updateData.append('title', formData.title.trim());
      updateData.append('description', formData.description.trim());
      updateData.append('goalAmount', formData.goalAmount);
      updateData.append('endDate', formData.endDate);
      updateData.append('category', formData.category);
      
      if (formData.image) {
        updateData.append('image', formData.image);
      }

      await campaignsAPI.updateCampaign(id, updateData);
      
      toast.success('Campaign updated successfully!');
      navigate(`/campaigns/${id}`);
      
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update campaign');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Campaign not found</h2>
          <button
            onClick={() => navigate('/dashboard')}
            className="btn-primary"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => navigate(`/campaigns/${id}`)}
            className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors mb-4"
          >
            <FaArrowLeft className="mr-2" />
            Back to Campaign
          </button>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Edit Campaign</h1>
          <p className="text-gray-600">Update your campaign details</p>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-xl p-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <FaFileAlt className="mr-3 text-blue-600" />
              Basic Information
            </h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Campaign Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter a compelling campaign title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={8}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Tell your story. Explain why this campaign matters and how donations will be used."
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  {formData.description.length}/2000 characters
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FaDollarSign className="inline mr-1" />
                    Goal Amount *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      $
                    </span>
                    <input
                      type="number"
                      name="goalAmount"
                      value={formData.goalAmount}
                      onChange={handleInputChange}
                      className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                      min="1"
                      step="0.01"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FaCalendarAlt className="inline mr-1" />
                    End Date *
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FaTag className="inline mr-1" />
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </motion.div>

          {/* Image Upload */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-xl p-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <FaImage className="mr-3 text-blue-600" />
              Campaign Image
            </h2>
            
            <div className="space-y-6">
              {formData.imagePreview && (
                <div className="relative">
                  <img
                    src={formData.imagePreview}
                    alt="Campaign preview"
                    className="w-full h-64 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, image: null, imagePreview: '' }))}
                    className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-colors"
                  >
                    <FaTimes />
                  </button>
                </div>
              )}
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                <FaImage className="mx-auto text-4xl text-gray-400 mb-4" />
                <p className="text-gray-600 mb-4">
                  {formData.imagePreview ? 'Change campaign image' : 'Upload a campaign image'}
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer inline-block"
                >
                  Choose Image
                </label>
                <p className="text-sm text-gray-500 mt-2">
                  Maximum file size: 5MB. Supported formats: JPG, PNG, GIF
                </p>
              </div>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-end"
          >
            <button
              type="button"
              onClick={() => navigate(`/campaigns/${id}`)}
              className="px-8 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              <FaTimes className="inline mr-2" />
              Cancel
            </button>
            
            <button
              type="submit"
              disabled={saving}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Updating...
                </>
              ) : (
                <>
                  <FaSave className="mr-2" />
                  Update Campaign
                </>
              )}
            </button>
          </motion.div>
        </form>
      </div>
    </div>
  );
};

export default EditCampaign;