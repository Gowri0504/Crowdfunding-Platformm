import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { FaUpload, FaTrash, FaPlus, FaInfoCircle } from 'react-icons/fa';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { campaignsAPI } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';

const CreateCampaign = () => {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      title: '',
      category: '',
      subcategory: '',
      description: '',
      shortDescription: '',
      targetAmount: '',
      currency: 'INR',
      deadline: '',
      story: '',
      tags: '',
      location: {
        country: '',
        state: '',
        city: ''
      },
      settings: {
        allowAnonymousDonations: true,
        showDonorList: true,
        allowComments: true,
        autoExtend: false,
        extendDays: 30
      }
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [images, setImages] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState([]);
  const [videoUrl, setVideoUrl] = useState('');
  const [videoType, setVideoType] = useState('youtube');
  const [faqs, setFaqs] = useState([{ question: '', answer: '' }]);
  const [rewards, setRewards] = useState([{ title: '', description: '', amount: '', quantity: -1 }]);
  const [isDraft, setIsDraft] = useState(false);
  
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  const categories = [
    'medical', 'education', 'emergency', 'creative', 'technology', 
    'environment', 'community', 'animals', 'sports', 'other'
  ];

  const handleImageChange = (e) => {
    e.preventDefault();
    
    const files = Array.from(e.target.files);
    if (files.length + imageFiles.length > 5) {
      toast.error('You can upload a maximum of 5 images');
      return;
    }
    
    const newImageFiles = [...imageFiles, ...files];
    setImageFiles(newImageFiles);
    
    const newImagePreviewUrls = files.map(file => URL.createObjectURL(file));
    setImagePreviewUrls([...imagePreviewUrls, ...newImagePreviewUrls]);
  };

  const removeImage = (index) => {
    const newImageFiles = [...imageFiles];
    newImageFiles.splice(index, 1);
    setImageFiles(newImageFiles);
    
    const newImagePreviewUrls = [...imagePreviewUrls];
    URL.revokeObjectURL(newImagePreviewUrls[index]);
    newImagePreviewUrls.splice(index, 1);
    setImagePreviewUrls(newImagePreviewUrls);
  };

  const addFaq = () => {
    setFaqs([...faqs, { question: '', answer: '' }]);
  };

  const removeFaq = (index) => {
    const newFaqs = [...faqs];
    newFaqs.splice(index, 1);
    setFaqs(newFaqs);
  };

  const handleFaqChange = (index, field, value) => {
    const newFaqs = [...faqs];
    newFaqs[index][field] = value;
    setFaqs(newFaqs);
  };

  const addReward = () => {
    setRewards([...rewards, { title: '', description: '', amount: '', quantity: -1 }]);
  };

  const removeReward = (index) => {
    const newRewards = [...rewards];
    newRewards.splice(index, 1);
    setRewards(newRewards);
  };

  const handleRewardChange = (index, field, value) => {
    const newRewards = [...rewards];
    newRewards[index][field] = value;
    setRewards(newRewards);
  };

  const nextStep = () => {
    setCurrentStep(currentStep + 1);
    window.scrollTo(0, 0);
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
    window.scrollTo(0, 0);
  };

  const validateCurrentStep = () => {
    if (currentStep === 1) {
      const title = watch('title');
      const category = watch('category');
      const description = watch('description');
      const shortDescription = watch('shortDescription');
      const targetAmount = watch('targetAmount');
      const deadline = watch('deadline');
      
      if (!title || !category || !description || !shortDescription || !targetAmount || !deadline) {
        toast.error('Please fill in all required fields');
        return false;
      }
      
      if (title.length < 10 || title.length > 100) {
        toast.error('Title must be between 10 and 100 characters');
        return false;
      }
      
      if (description.length < 50 || description.length > 2000) {
        toast.error('Description must be between 50 and 2000 characters');
        return false;
      }
      
      if (shortDescription.length < 20 || shortDescription.length > 200) {
        toast.error('Short description must be between 20 and 200 characters');
        return false;
      }
      
      if (targetAmount < 1) {
        toast.error('Target amount must be at least 1');
        return false;
      }
      
      const deadlineDate = new Date(deadline);
      const now = new Date();
      const minDeadline = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
      
      if (deadlineDate <= now) {
        toast.error('Deadline must be in the future');
        return false;
      }
      
      if (deadlineDate < minDeadline) {
        toast.error('Deadline must be at least 7 days from now');
        return false;
      }
    }
    
    if (currentStep === 2) {
      const story = watch('story');
      
      if (!story) {
        toast.error('Please provide your campaign story');
        return false;
      }
      
      if (story.length < 100) {
        toast.error('Story must be at least 100 characters');
        return false;
      }
    }
    
    return true;
  };

  const handleStepChange = (direction) => {
    if (direction === 'next') {
      if (validateCurrentStep()) {
        nextStep();
      }
    } else {
      prevStep();
    }
  };

  const onSubmit = async (data) => {
    if (!validateCurrentStep()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Prepare campaign data
      const campaignData = {
        ...data,
        faqs: faqs.filter(faq => faq.question && faq.answer),
        rewards: rewards.filter(reward => reward.title && reward.amount),
        tags: data.tags ? data.tags.split(',').map(tag => tag.trim()) : [],
        status: isDraft ? 'draft' : 'pending'
      };
      
      // Convert nested objects to strings for API
      const formattedCampaignData = {
        ...campaignData,
        faqs: JSON.stringify(campaignData.faqs),
        rewards: JSON.stringify(campaignData.rewards),
        settings: JSON.stringify(campaignData.settings),
        targetAmount: Number(campaignData.targetAmount) // Ensure targetAmount is a number
      };
      
      // Create campaign
      const response = await campaignsAPI.createCampaign(formattedCampaignData);
      const campaignId = response.data?.data?.campaign?._id || response.data?.campaign?._id || response.data?._id;
      
      if (!campaignId) {
        throw new Error('Failed to get campaign ID from response');
      }
      
      // Upload images if any
      if (imageFiles.length > 0) {
        const formData = new FormData();
        imageFiles.forEach(file => {
          formData.append('images', file);
        });
        
        await campaignsAPI.uploadImages(campaignId, formData);
      }
      
      toast.success(isDraft ? 'Campaign saved as draft' : 'Campaign submitted for review');
      navigate(isDraft ? '/dashboard' : `/campaigns/${campaignId}`);
    } catch (error) {
      console.error('Error creating campaign:', error);
      const errorMessage = error.response?.data?.message || 'Failed to create campaign';
      toast.error(errorMessage);
      
      // Log detailed error information for debugging
      if (error.response) {
        console.log('Error response data:', error.response.data);
        console.log('Error response status:', error.response.status);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-8 md:py-12">
      {isLoading && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl flex flex-col items-center">
            <LoadingSpinner size="large" text="Creating your campaign..." />
          </div>
        </div>
      )}
      <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-xl shadow-md overflow-hidden"
        >
          {/* Header */}
          <div className="bg-primary-600 px-3 sm:px-4 md:px-6 py-3 sm:py-4">
            <h1 className="text-xl sm:text-2xl font-bold text-white">Create Campaign</h1>
            <div className="flex flex-wrap mt-3 sm:mt-4 mb-1 sm:mb-2">
              <div className="flex items-center">
                  <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-base ${currentStep >= 1 ? 'bg-white text-primary-600' : 'bg-gray-300 text-gray-600'}`}>1</div>
                  <span className="ml-1 sm:ml-2 text-white text-xs sm:text-sm">Basics</span>
                </div>
                <div className={`flex-1 h-1 mx-2 sm:mx-4 my-auto ${currentStep >= 2 ? 'bg-white' : 'bg-gray-300'}`}></div>
                <div className="flex items-center">
                  <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-base ${currentStep >= 2 ? 'bg-white text-primary-600' : 'bg-gray-300 text-gray-600'}`}>2</div>
                  <span className="ml-1 sm:ml-2 text-white text-xs sm:text-sm">Story</span>
                </div>
                <div className={`flex-1 h-1 mx-2 sm:mx-4 my-auto ${currentStep >= 3 ? 'bg-white' : 'bg-gray-300'}`}></div>
                <div className="flex items-center">
                  <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-base ${currentStep >= 3 ? 'bg-white text-primary-600' : 'bg-gray-300 text-gray-600'}`}>3</div>
                  <span className="ml-1 sm:ml-2 text-white text-xs sm:text-sm">Media</span>
                </div>
                <div className={`flex-1 h-1 mx-2 sm:mx-4 my-auto ${currentStep >= 4 ? 'bg-white' : 'bg-gray-300'}`}></div>
                <div className="flex items-center">
                  <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-base ${currentStep >= 4 ? 'bg-white text-primary-600' : 'bg-gray-300 text-gray-600'}`}>4</div>
                  <span className="ml-1 sm:ml-2 text-white text-xs sm:text-sm">Rewards</span>
                </div>
            </div>
          </div>
          
          <form onSubmit={handleSubmit(onSubmit)} className="p-3 sm:p-4 md:p-6">
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Campaign Title <span className="text-red-500">*</span></label>
                  <input
                    id="title"
                    type="text"
                    {...register('title', { 
                      required: 'Title is required',
                      minLength: { value: 10, message: 'Title must be at least 10 characters' },
                      maxLength: { value: 100, message: 'Title cannot exceed 100 characters' }
                    })}
                    className={`appearance-none block w-full px-3 py-2 border ${errors.title ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
                    placeholder="Give your campaign a clear, attention-grabbing title"
                  />
                  {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Category <span className="text-red-500">*</span></label>
                    <select
                      id="category"
                      {...register('category', { required: 'Category is required' })}
                      className={`appearance-none block w-full px-3 py-2 border ${errors.category ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
                    >
                      <option value="">Select a category</option>
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </option>
                      ))}
                    </select>
                    {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>}
                  </div>
                  
                  <div>
                    <label htmlFor="subcategory" className="block text-sm font-medium text-gray-700 mb-1">Subcategory</label>
                    <input
                      id="subcategory"
                      type="text"
                      {...register('subcategory')}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      placeholder="Optional subcategory"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="shortDescription" className="block text-sm font-medium text-gray-700 mb-1">Short Description <span className="text-red-500">*</span></label>
                  <textarea
                    id="shortDescription"
                    rows="2"
                    {...register('shortDescription', { 
                      required: 'Short description is required',
                      minLength: { value: 20, message: 'Short description must be at least 20 characters' },
                      maxLength: { value: 200, message: 'Short description cannot exceed 200 characters' }
                    })}
                    className={`appearance-none block w-full px-3 py-2 border ${errors.shortDescription ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
                    placeholder="A brief summary of your campaign (will appear in search results)"
                  ></textarea>
                  {errors.shortDescription && <p className="mt-1 text-sm text-red-600">{errors.shortDescription.message}</p>}
                  <p className="mt-1 text-xs text-gray-500">{watch('shortDescription')?.length || 0}/200 characters</p>
                </div>
                
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-red-500">*</span></label>
                  <textarea
                    id="description"
                    rows="4"
                    {...register('description', { 
                      required: 'Description is required',
                      minLength: { value: 50, message: 'Description must be at least 50 characters' },
                      maxLength: { value: 2000, message: 'Description cannot exceed 2000 characters' }
                    })}
                    className={`appearance-none block w-full px-3 py-2 border ${errors.description ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
                    placeholder="Provide a detailed description of your campaign"
                  ></textarea>
                  {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>}
                  <p className="mt-1 text-xs text-gray-500">{watch('description')?.length || 0}/2000 characters</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label htmlFor="targetAmount" className="block text-sm font-medium text-gray-700 mb-1">Target Amount <span className="text-red-500">*</span></label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <input
                        id="targetAmount"
                        type="number"
                        min="1"
                        step="1"
                        {...register('targetAmount', { 
                          required: 'Target amount is required',
                          min: { value: 1, message: 'Target amount must be at least 1' }
                        })}
                        className={`appearance-none block w-full px-3 py-2 border ${errors.targetAmount ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
                        placeholder="10000"
                      />
                    </div>
                    {errors.targetAmount && <p className="mt-1 text-sm text-red-600">{errors.targetAmount.message}</p>}
                  </div>
                  
                  <div>
                    <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                    <select
                      id="currency"
                      {...register('currency')}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    >
                      <option value="INR">Indian Rupee (₹)</option>
                      <option value="USD">US Dollar ($)</option>
                      <option value="EUR">Euro (€)</option>
                      <option value="GBP">British Pound (£)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="upiId" className="block text-sm font-medium text-gray-700 mb-1">UPI ID (for direct donations)</label>
                    <input
                      id="upiId"
                      type="text"
                      {...register('upiId')}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      placeholder="yourname@upi"
                    />
                    <p className="mt-1 text-xs text-gray-500">This will be used to generate QR codes for direct UPI payments</p>
                  </div>
                  
                  <div>
                    <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-1">Deadline <span className="text-red-500">*</span></label>
                    <input
                      id="deadline"
                      type="date"
                      {...register('deadline', { required: 'Deadline is required' })}
                      className={`appearance-none block w-full px-3 py-2 border ${errors.deadline ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
                      min={new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                    />
                    {errors.deadline && <p className="mt-1 text-sm text-red-600">{errors.deadline.message}</p>}
                    <p className="mt-1 text-xs text-gray-500">Minimum 7 days from today</p>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                  <input
                    id="tags"
                    type="text"
                    {...register('tags')}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    placeholder="Enter tags separated by commas (e.g., education, children, healthcare)"
                  />
                  <p className="mt-1 text-xs text-gray-500">Tags help people find your campaign</p>
                </div>
                
                <div className="border-t border-gray-200 pt-4 sm:pt-6">
                  <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2 sm:mb-4">Location</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                    <div>
                      <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                      <input
                        id="country"
                        type="text"
                        {...register('location.country')}
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        placeholder="Country"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">State/Province</label>
                      <input
                        id="state"
                        type="text"
                        {...register('location.state')}
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        placeholder="State/Province"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">City</label>
                      <input
                        id="city"
                        type="text"
                        {...register('location.city')}
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        placeholder="City"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Step 2: Story */}
            {currentStep === 2 && (
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label htmlFor="story" className="block text-sm font-medium text-gray-700">Your Campaign Story <span className="text-red-500">*</span></label>
                    <span className="text-xs text-gray-500">{watch('story')?.length || 0} characters</span>
                  </div>
                  <p className="text-sm text-gray-500 mb-2">Tell potential donors why your campaign matters, how the funds will be used, and the impact their donations will make.</p>
                  <textarea
                    id="story"
                    rows="15"
                    {...register('story', { 
                      required: 'Story is required',
                      minLength: { value: 100, message: 'Story must be at least 100 characters' }
                    })}
                    className={`appearance-none block w-full px-3 py-2 border ${errors.story ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
                    placeholder="Share your story here..."
                  ></textarea>
                  {errors.story && <p className="mt-1 text-sm text-red-600">{errors.story.message}</p>}
                </div>
                
                <div className="bg-blue-50 p-3 sm:p-4 rounded-md">
                  <h4 className="text-sm font-medium text-blue-800 mb-2 flex items-center">
                    <FaInfoCircle className="mr-2" /> Tips for a compelling story
                  </h4>
                  <ul className="text-sm text-blue-700 list-disc pl-5 space-y-1">
                    <li>Be authentic and personal</li>
                    <li>Clearly explain why you're raising funds</li>
                    <li>Describe how the money will be used</li>
                    <li>Share the impact donations will make</li>
                    <li>Include a timeline if relevant</li>
                    <li>Thank potential donors in advance</li>
                  </ul>
                </div>
              </div>
            )}
            
            {/* Step 3: Media */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Campaign Images</h3>
                  <p className="text-sm text-gray-500 mb-4">Upload up to 5 high-quality images that showcase your campaign. The first image will be your campaign's main image.</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mb-3 sm:mb-4">
                    {imagePreviewUrls.map((url, index) => (
                      <div key={index} className="relative">
                        <img src={url} alt={`Preview ${index + 1}`} className="w-full h-40 object-cover rounded-md" />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full hover:bg-red-700"
                        >
                          <FaTrash size={14} />
                        </button>
                        {index === 0 && (
                          <div className="absolute bottom-0 left-0 right-0 bg-primary-600 text-white text-xs py-1 text-center">
                            Main Image
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {imagePreviewUrls.length < 5 && (
                      <div 
                        className="border-2 border-dashed border-gray-300 rounded-md h-40 flex flex-col items-center justify-center cursor-pointer hover:border-primary-500"
                        onClick={() => fileInputRef.current.click()}
                      >
                        <FaUpload className="text-gray-400 mb-2" size={24} />
                        <span className="text-sm text-gray-500">Upload Image</span>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleImageChange}
                          accept="image/*"
                          className="hidden"
                          multiple
                        />
                      </div>
                    )}
                  </div>
                  
                  <p className="text-xs text-gray-500">{imagePreviewUrls.length}/5 images uploaded</p>
                </div>
                
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Campaign Video (Optional)</h3>
                  <p className="text-sm text-gray-500 mb-4">A video can significantly increase your campaign's success rate.</p>
                  
                  <div className="mb-4">
                    <label htmlFor="videoType" className="block text-sm font-medium text-gray-700 mb-1">Video Type</label>
                    <select
                      id="videoType"
                      value={videoType}
                      onChange={(e) => setVideoType(e.target.value)}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    >
                      <option value="youtube">YouTube</option>
                      <option value="vimeo">Vimeo</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="videoUrl" className="block text-sm font-medium text-gray-700 mb-1">Video URL</label>
                    <input
                      id="videoUrl"
                      type="text"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      placeholder={`Enter ${videoType === 'youtube' ? 'YouTube' : 'Vimeo'} URL`}
                    />
                    <p className="mt-1 text-xs text-gray-500">Paste the full URL of your video</p>
                  </div>
                </div>
                
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Frequently Asked Questions</h3>
                  <p className="text-sm text-gray-500 mb-4">Add FAQs to address common questions donors might have about your campaign.</p>
                  
                  {faqs.map((faq, index) => (
                    <div key={index} className="mb-4 p-4 border border-gray-200 rounded-md">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-sm font-medium text-gray-700">FAQ #{index + 1}</h4>
                        {faqs.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeFaq(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <FaTrash size={14} />
                          </button>
                        )}
                      </div>
                      
                      <div className="mb-2">
                        <label htmlFor={`faq-question-${index}`} className="block text-sm font-medium text-gray-700 mb-1">Question</label>
                        <input
                          id={`faq-question-${index}`}
                          type="text"
                          value={faq.question}
                          onChange={(e) => handleFaqChange(index, 'question', e.target.value)}
                          className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                          placeholder="E.g., How will the funds be used?"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor={`faq-answer-${index}`} className="block text-sm font-medium text-gray-700 mb-1">Answer</label>
                        <textarea
                          id={`faq-answer-${index}`}
                          rows="3"
                          value={faq.answer}
                          onChange={(e) => handleFaqChange(index, 'answer', e.target.value)}
                          className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                          placeholder="Provide a clear, concise answer"
                        ></textarea>
                      </div>
                    </div>
                  ))}
                  
                  <button
                    type="button"
                    onClick={addFaq}
                    className="flex items-center text-primary-600 hover:text-primary-800"
                  >
                    <FaPlus size={14} className="mr-1" /> Add another FAQ
                  </button>
                </div>
              </div>
            )}
            
            {/* Step 4: Rewards */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Rewards for Donors</h3>
                  <p className="text-sm text-gray-500 mb-4">Offering rewards can incentivize larger donations. Define what donors will receive at different contribution levels.</p>
                  
                  {rewards.map((reward, index) => (
                    <div key={index} className="mb-4 p-4 border border-gray-200 rounded-md">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-sm font-medium text-gray-700">Reward #{index + 1}</h4>
                        {rewards.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeReward(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <FaTrash size={14} />
                          </button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                        <div>
                          <label htmlFor={`reward-title-${index}`} className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                          <input
                            id={`reward-title-${index}`}
                            type="text"
                            value={reward.title}
                            onChange={(e) => handleRewardChange(index, 'title', e.target.value)}
                            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                            placeholder="E.g., Early Supporter, Premium Package"
                          />
                        </div>
                        
                        <div>
                          <label htmlFor={`reward-amount-${index}`} className="block text-sm font-medium text-gray-700 mb-1">Minimum Donation Amount</label>
                          <input
                            id={`reward-amount-${index}`}
                            type="number"
                            min="1"
                            value={reward.amount}
                            onChange={(e) => handleRewardChange(index, 'amount', e.target.value)}
                            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                            placeholder="Amount"
                          />
                        </div>
                      </div>
                      
                      <div className="mb-2">
                        <label htmlFor={`reward-description-${index}`} className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                          id={`reward-description-${index}`}
                          rows="3"
                          value={reward.description}
                          onChange={(e) => handleRewardChange(index, 'description', e.target.value)}
                          className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                          placeholder="Describe what donors will receive"
                        ></textarea>
                      </div>
                      
                      <div>
                        <label htmlFor={`reward-quantity-${index}`} className="block text-sm font-medium text-gray-700 mb-1">Quantity Available</label>
                        <input
                          id={`reward-quantity-${index}`}
                          type="number"
                          min="-1"
                          value={reward.quantity}
                          onChange={(e) => handleRewardChange(index, 'quantity', e.target.value)}
                          className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                          placeholder="Quantity (-1 for unlimited)"
                        />
                        <p className="mt-1 text-xs text-gray-500">Enter -1 for unlimited quantity</p>
                      </div>
                    </div>
                  ))}
                  
                  <button
                    type="button"
                    onClick={addReward}
                    className="flex items-center text-primary-600 hover:text-primary-800"
                  >
                    <FaPlus size={14} className="mr-1" /> Add another reward
                  </button>
                </div>
                
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Campaign Settings</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <input
                        id="allowAnonymousDonations"
                        type="checkbox"
                        {...register('settings.allowAnonymousDonations')}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label htmlFor="allowAnonymousDonations" className="ml-2 block text-sm text-gray-900">
                        Allow anonymous donations
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        id="showDonorList"
                        type="checkbox"
                        {...register('settings.showDonorList')}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label htmlFor="showDonorList" className="ml-2 block text-sm text-gray-900">
                        Show donor list on campaign page
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        id="allowComments"
                        type="checkbox"
                        {...register('settings.allowComments')}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label htmlFor="allowComments" className="ml-2 block text-sm text-gray-900">
                        Allow comments on campaign
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        id="autoExtend"
                        type="checkbox"
                        {...register('settings.autoExtend')}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label htmlFor="autoExtend" className="ml-2 block text-sm text-gray-900">
                        Auto-extend campaign if target not reached by deadline
                      </label>
                    </div>
                    
                    {watch('settings.autoExtend') && (
                      <div className="ml-6">
                        <label htmlFor="extendDays" className="block text-sm font-medium text-gray-700 mb-1">Extension Period (days)</label>
                        <input
                          id="extendDays"
                          type="number"
                          min="1"
                          max="90"
                          {...register('settings.extendDays')}
                          className="appearance-none block w-40 px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* Navigation Buttons */}
            <div className="mt-4 sm:mt-6 md:mt-8 flex flex-col sm:flex-row justify-between gap-3 sm:gap-0">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={() => handleStepChange('prev')}
                  className="btn-outline w-full sm:w-auto text-sm sm:text-base py-2 sm:py-2.5"
                >
                  Previous
                </button>
              ) : (
                <Link to="/" className="btn-outline w-full sm:w-auto text-sm sm:text-base py-2 sm:py-2.5 text-center">
                  Cancel
                </Link>
              )}
              
              <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-3 sm:space-y-0">
                {currentStep === 4 && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsDraft(true);
                      handleSubmit(onSubmit)();
                    }}
                    className="btn-outline w-full sm:w-auto text-sm sm:text-base py-2 sm:py-2.5"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Saving...' : 'Save as Draft'}
                  </button>
                )}
                
                {currentStep < 4 ? (
                  <button
                    type="button"
                    onClick={() => handleStepChange('next')}
                    className="btn-primary w-full sm:w-auto text-sm sm:text-base py-2 sm:py-2.5"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="btn-primary w-full sm:w-auto text-sm sm:text-base py-2 sm:py-2.5"
                    disabled={isLoading}
                    onClick={() => setIsDraft(false)}
                  >
                    {isLoading ? 'Submitting...' : 'Submit Campaign'}
                  </button>
                )}
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default CreateCampaign;