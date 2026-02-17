import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaTimes } from 'react-icons/fa';
import axios from '../../axios';
import toast from 'react-hot-toast';

const CampaignUpdateForm = ({ campaignId, onUpdateAdded }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      toast.error('Please provide both title and content for your update');
      return;
    }
    
    try {
      setLoading(true);
      
      const response = await axios.post(`/api/campaigns/${campaignId}/updates`, {
        title,
        content,
        images
      });
      
      toast.success('Update posted successfully!');
      
      // Reset form
      setTitle('');
      setContent('');
      setImages([]);
      
      // Notify parent component
      if (onUpdateAdded) {
        onUpdateAdded(response.data.update);
      }
      
    } catch (error) {
      console.error('Error posting update:', error);
      toast.error(error.response?.data?.message || 'Failed to post update');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <h3 className="text-lg font-semibold mb-4">Post an Update</h3>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="update-title" className="block text-sm font-medium text-gray-700 mb-1">
            Update Title
          </label>
          <input
            id="update-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="What's new with your campaign?"
            required
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="update-content" className="block text-sm font-medium text-gray-700 mb-1">
            Update Content
          </label>
          <textarea
            id="update-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            rows="4"
            placeholder="Share details about your progress, milestones, or changes..."
            required
          />
        </div>
        
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? 'Posting...' : 'Post Update'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CampaignUpdateForm;