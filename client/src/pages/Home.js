import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaRocket, FaShieldAlt, FaUsers, FaHeart, FaGlobe, FaStar, FaArrowRight, FaPlay, FaBolt, FaChevronLeft, FaChevronRight, FaQuoteLeft } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { campaignsAPI } from '../services/api';
import CampaignCard from '../components/CampaignCard/CampaignCard';
import LoadingSpinner from '../components/LoadingSpinner/LoadingSpinner';
import sampleCampaigns from '../data/sampleCampaigns';

const Home = () => {
  const { isAuthenticated } = useAuth();
  const [featuredCampaigns, setFeaturedCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [videoPlaying, setVideoPlaying] = useState(false);
  
  // Online image URLs for all assets
  const homeBanner = "https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1";
  const homeFeatures = "https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1";
  const homeCommunity = "https://images.pexels.com/photos/3184296/pexels-photo-3184296.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1";

  // Hero carousel with online images
  const heroSlides = [
    {
      image: "https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
      title: 'Transform Ideas into Reality',
      subtitle: 'Join thousands of creators bringing their dreams to life through crowdfunding',
      cta: 'Start Your Campaign',
      link: '/campaigns/create'
    },
    {
      image: "https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
      title: 'Support Innovation',
      subtitle: 'Back groundbreaking projects and be part of the future',
      cta: 'Explore Campaigns',
      link: '/campaigns'
    },
    {
      image: "https://images.pexels.com/photos/3184339/pexels-photo-3184339.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
      title: 'Build Communities',
      subtitle: 'Connect with like-minded people and create lasting impact',
      cta: 'Join Community',
      link: '/campaigns'
    }
  ];

  // Success stories with online images
  const successStories = [
    {
      image: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1828&q=80",
      title: 'EcoTech Water Purifier',
      raised: '₹2,50,000',
      backers: 1250,
      category: 'Technology'
    },
    {
      image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1825&q=80",
      title: 'Rural Education Initiative',
      raised: '₹5,00,000',
      backers: 2100,
      category: 'Education'
    },
    {
      image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1776&q=80",
      title: 'Sustainable Fashion Brand',
      raised: '₹1,75,000',
      backers: 890,
      category: 'Fashion'
    }
  ];

  // Timeline data for company milestones
  const timeline = [
    {
      year: '2020',
      title: 'Platform Launch',
      description: 'DreamLift was born with a vision to democratize fundraising and make it accessible to everyone.',
      stats: 'First 100 campaigns launched',
      icon: FaRocket,
      image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80"
    },
    {
      year: '2021',
      title: 'Global Expansion',
      description: 'Expanded to 10 countries and introduced multi-currency support for international campaigns.',
      stats: '₹10M+ raised across 25 countries',
      icon: FaGlobe,
      image: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80"
    },
    {
      year: '2022',
      title: 'Community Growth',
      description: 'Reached 50,000 active users and launched our mobile app for better accessibility.',
      stats: '50K+ active users, 5K+ successful campaigns',
      icon: FaUsers,
      image: "https://images.unsplash.com/photo-1579389083078-4e7018379f7e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80"
    },
    {
      year: '2023',
      title: 'Innovation Hub',
      description: 'Introduced AI-powered campaign optimization and blockchain-based transparency features.',
      stats: '₹50M+ total raised, 99.9% uptime',
      icon: FaBolt,
      image: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1765&q=80"
    }
  ];

  // Testimonials with online images
  const testimonials = [
    {
      name: 'Arunprasad S',
      role: 'Tech Entrepreneur',
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1887&q=80",
      quote: 'DreamLift helped me raise ₹2.5M for my AI startup. The platform is intuitive and the community is incredibly supportive.',
      rating: 5,
      campaign: 'AI-Powered Healthcare Assistant'
    },
    {
      name: 'Durga Devi R',
      role: 'Social Activist',
      image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1771&q=80",
      quote: 'Thanks to DreamLift, we built 10 schools in rural areas. The transparency and trust features are outstanding.',
      rating: 5,
      campaign: 'Education for All Initiative'
    },
    {
      name: 'Dhivya JM',
      role: 'Artist',
      image: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1727&q=80",
      quote: 'As a creative, finding funding was always challenging. DreamLift made it possible to bring my art installation to life.',
      rating: 5,
      campaign: 'Interactive Art Experience'
    }
  ];

  // Platform statistics
  const stats = [
    { label: 'Total Raised', value: '₹50M+', icon: FaHeart, color: 'text-red-500' },
    { label: 'Successful Campaigns', value: '10,000+', icon: FaRocket, color: 'text-blue-500' },
    { label: 'Active Backers', value: '100K+', icon: FaUsers, color: 'text-green-500' },
    { label: 'Countries', value: '25+', icon: FaGlobe, color: 'text-purple-500' }
  ];

  // Features with online images
  const features = [
    {
      icon: FaShieldAlt,
      title: 'Secure & Transparent',
      description: 'Advanced security measures, escrow protection, and complete transparency in all transactions with blockchain verification',
      color: 'from-blue-500 to-blue-600',
      image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1774&q=80"
    },
    {
      icon: FaBolt,
      title: 'Lightning Fast',
      description: 'Quick campaign setup in under 5 minutes, instant payment processing, and real-time analytics dashboard',
      color: 'from-yellow-500 to-orange-500',
      image: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1674&q=80"
    },
    {
      icon: FaUsers,
      title: 'Global Community',
      description: 'Connect with supporters and creators from around the world, join interest-based groups, and collaborate',
      color: 'from-green-500 to-green-600',
      image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1771&q=80"
    },
    {
      icon: FaHeart,
      title: 'Impact Driven',
      description: 'Every campaign creates real-world impact with detailed progress tracking and impact measurement tools',
      color: 'from-pink-500 to-red-500',
      image: "https://images.unsplash.com/photo-1504805572947-34fad45aed93?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80"
    }
  ];

  // Categories with online images
  const categories = [
    {
      name: 'Technology',
      icon: FaBolt,
      image: "https://images.unsplash.com/photo-1518770660439-4636190af475?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80",
      count: '2,500+ campaigns'
    },
    {
      name: 'Education',
      icon: FaUsers,
      image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80",
      count: '1,800+ campaigns'
    },
    {
      name: 'Healthcare',
      icon: FaHeart,
      image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80",
      count: '1,200+ campaigns'
    },
    {
      name: 'Environment',
      icon: FaGlobe,
      image: "https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80",
      count: '900+ campaigns'
    }
  ];

  useEffect(() => {
    fetchCampaigns();
  }, []);

  // Auto-advance carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  // Auto-advance testimonials
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [testimonials.length]);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const featuredResponse = await campaignsAPI.getCampaigns({ limit: 6, sort: '-raisedAmount' });
      
      // Server sends: { success: true, message, data: { campaigns, pagination } }
      let campaigns = [];
      if (featuredResponse.data && featuredResponse.data.data && featuredResponse.data.data.campaigns) {
        campaigns = featuredResponse.data.data.campaigns || [];
      }
      setFeaturedCampaigns(campaigns);
    } catch (error) {
      // Use sample campaign data if there's an error
      setFeaturedCampaigns(sampleCampaigns);
      toast.success('Loaded sample campaign data');
    } finally {
      setLoading(false);
    }
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

  return (
    <div className="min-h-screen">
      {/* Hero Carousel Section */}
      <section className="relative h-screen overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={`hero-slide-${currentSlide}`}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0"
          >
            <div
              className="w-full h-full bg-cover bg-center"
              style={{ backgroundImage: `url(${heroSlides[currentSlide].image})` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30" />
              
              {/* Hero Content */}
              <div className="relative z-10 flex items-center justify-center h-full">
                <div className="text-center text-white max-w-4xl mx-auto px-4 sm:px-6">
                  <motion.h1
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.8 }}
                    className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold mb-4 sm:mb-6 leading-tight"
                  >
                    {heroSlides[currentSlide].title}
                  </motion.h1>
                  <motion.p
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.8 }}
                    className="text-base sm:text-lg md:text-xl lg:text-2xl mb-6 sm:mb-8 text-gray-200"
                  >
                    {heroSlides[currentSlide].subtitle}
                  </motion.p>
                  <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.8 }}
                    className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center"
                  >
                    <Link
                      to={heroSlides[currentSlide].link}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full font-semibold text-base sm:text-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
                    >
                      {heroSlides[currentSlide].cta}
                      <FaArrowRight className="inline ml-2" />
                    </Link>
                    <button
                      onClick={() => setVideoPlaying(true)}
                      className="bg-white/20 backdrop-blur-sm border border-white/30 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full font-semibold text-base sm:text-lg transition-all duration-300 hover:bg-white/30 flex items-center justify-center"
                    >
                      <FaPlay className="mr-2" />
                      Watch Demo
                    </button>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Arrows */}
        <button
          onClick={prevSlide}
          className="absolute left-6 top-1/2 transform -translate-y-1/2 bg-white/20 backdrop-blur-sm text-white p-3 rounded-full hover:bg-white/30 transition-all duration-300 z-20"
        >
          <FaChevronLeft size={20} />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-6 top-1/2 transform -translate-y-1/2 bg-white/20 backdrop-blur-sm text-white p-3 rounded-full hover:bg-white/30 transition-all duration-300 z-20"
        >
          <FaChevronRight size={20} />
        </button>

        {/* Slide Indicators */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-3 z-20">
          {heroSlides.map((_, index) => (
            <button
              key={`slide-indicator-${index}`}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentSlide ? 'bg-white scale-125' : 'bg-white/50'
              }`}
            />
          ))}
        </div>
      </section>

      {/* Video Modal */}
      <AnimatePresence>
        {videoPlaying && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setVideoPlaying(false)}
          >
            <motion.div
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.5 }}
              className="relative max-w-4xl w-full aspect-video"
              onClick={(e) => e.stopPropagation()}
            >
              <iframe
                src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1"
                title="DreamLift Demo"
                className="w-full h-full rounded-lg"
                allowFullScreen
              />
              <button
                onClick={() => setVideoPlaying(false)}
                className="absolute -top-12 right-0 text-white text-2xl hover:text-gray-300"
              >
                ✕
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Banner Image Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <img 
            src={homeBanner} 
            alt="DreamLift Platform" 
            className="w-full h-auto rounded-xl shadow-lg mb-12"
          />
        </div>
      </section>
      
      {/* Stats Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8 sm:mb-10 md:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-2 sm:mb-3">Our Impact</h2>
            <p className="text-base sm:text-lg text-gray-600">Making a difference together</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ y: 50, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className={`inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-white shadow-lg mb-3 sm:mb-4 ${stat.color}`}>
                  <stat.icon size={20} className="sm:text-2xl" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1 sm:mb-2">{stat.value}</h3>
                <p className="text-sm sm:text-base text-gray-600">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <img 
            src={homeFeatures} 
            alt="DreamLift Features" 
            className="w-full h-auto rounded-xl shadow-lg mb-12"
          />
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-3 sm:mb-4">Why Choose DreamLift?</h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
              We provide the most comprehensive and secure crowdfunding platform with cutting-edge features
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ y: 50, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                viewport={{ once: true }}
                className="group relative overflow-hidden rounded-2xl bg-white shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
              >
                <div className="aspect-w-16 aspect-h-9">
                  <img
                    src={feature.image}
                    alt={feature.title}
                    className="w-full h-40 sm:h-48 object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <div className="p-4 sm:p-6">
                  <div className={`inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-r ${feature.color} text-white mb-3 sm:mb-4`}>
                    <feature.icon size={18} className="sm:text-xl" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2 sm:mb-3">{feature.title}</h3>
                  <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-3 sm:mb-4">Explore Categories</h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600">Find campaigns that match your interests</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {categories.map((category, index) => (
              <motion.div
                key={index}
                initial={{ scale: 0.9, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                viewport={{ once: true }}
                className="group relative overflow-hidden rounded-xl cursor-pointer"
              >
                <div className="aspect-w-16 aspect-h-12">
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-48 sm:h-56 md:h-64 object-cover group-hover:scale-110 transition-transform duration-300"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.style.display = 'none';
                      e.target.parentNode.innerHTML = '<div class="w-full h-full bg-gray-200 flex items-center justify-center"><span class="text-gray-500 text-lg">Image not available</span></div>';
                    }}
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 text-white">
                  <category.icon className="text-xl sm:text-2xl mb-1 sm:mb-2" />
                  <h3 className="text-lg sm:text-xl font-bold mb-0.5 sm:mb-1">{category.name}</h3>
                  <p className="text-xs sm:text-sm text-gray-200">{category.count}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Success Stories Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-3 sm:mb-4">Success Stories</h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600">Real campaigns that made a difference</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
            {successStories.map((story, index) => (
              <motion.div
                key={`success-story-${index}`}
                initial={{ y: 50, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ delay: index * 0.2, duration: 0.6 }}
                viewport={{ once: true }}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow duration-300"
              >
                <img
                  src={story.image}
                  alt={story.title}
                  className="w-full h-40 sm:h-48 object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.style.display = 'none';
                    e.target.parentNode.innerHTML = '<div class="w-full h-full bg-gray-200 flex items-center justify-center"><span class="text-gray-500 text-lg">Image not available</span></div>';
                  }}
                />
                <div className="p-4 sm:p-6">
                  <span className="inline-block px-2 sm:px-3 py-1 bg-blue-100 text-blue-800 text-xs sm:text-sm font-medium rounded-full mb-2 sm:mb-3">
                    {story.category}
                  </span>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2 sm:mb-3">{story.title}</h3>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-2xl font-bold text-green-600">{story.raised}</p>
                      <p className="text-sm text-gray-600">raised</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-gray-800">{story.backers}</p>
                      <p className="text-sm text-gray-600">backers</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Campaigns */}
      {!loading && featuredCampaigns.length > 0 && (
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-800 mb-4">Featured Campaigns</h2>
              <p className="text-xl text-gray-600">Discover amazing projects from our community</p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredCampaigns.map((campaign, index) => (
                <motion.div
                  key={campaign._id}
                  initial={{ y: 50, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  transition={{ delay: index * 0.1, duration: 0.6 }}
                  viewport={{ once: true }}
                >
                  <CampaignCard campaign={campaign} />
                </motion.div>
              ))}
            </div>
            
            <div className="text-center mt-12">
              <Link
                to="/campaigns"
                className="inline-flex items-center bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-full font-semibold transition-all duration-300 transform hover:scale-105"
              >
                View All Campaigns
                <FaArrowRight className="ml-2" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Community Image Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-3 sm:mb-4">Our Growing Community</h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
              Join thousands of creators and backers in our thriving community
            </p>
          </div>
          <img 
            src={homeCommunity} 
            alt="DreamLift Community" 
            className="w-full h-auto rounded-xl shadow-lg mb-12"
          />
        </div>
      </section>
      
      {/* Testimonials Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8 sm:mb-12 md:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-2 sm:mb-4">What Our Users Say</h2>
            <p className="text-lg sm:text-xl text-blue-100">Real feedback from real people</p>
          </div>
          
          <div className="flex justify-center mb-8 sm:mb-12">
            <img src="https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80" alt="Testimonials" className="w-full max-w-xl sm:max-w-2xl h-64 object-cover rounded-xl" />
          </div>
          
          <div className="relative max-w-4xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={`testimonial-content-${currentTestimonial}`}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.5 }}
                className="text-center px-4 sm:px-0"
              >
                <FaQuoteLeft className="text-3xl sm:text-4xl text-blue-200 mx-auto mb-4 sm:mb-6" />
                <blockquote className="text-xl sm:text-2xl font-light mb-6 sm:mb-8 leading-relaxed">
                  "{testimonials[currentTestimonial].quote}"
                </blockquote>
                <div className="flex flex-col sm:flex-row items-center justify-center sm:space-x-4 space-y-3 sm:space-y-0">
                  <img
                    src={testimonials[currentTestimonial].image}
                    alt={testimonials[currentTestimonial].name}
                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border-4 border-white/20"
                  />
                  <div className="text-center sm:text-left">
                    <h4 className="font-semibold text-base sm:text-lg">{testimonials[currentTestimonial].name}</h4>
                    <p className="text-blue-200 text-sm sm:text-base">{testimonials[currentTestimonial].role}</p>
                    <div className="flex justify-center sm:justify-start space-x-1 mt-1">
                      {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                        <FaStar key={`star-${currentTestimonial}-${i}`} className="text-yellow-400 text-xs sm:text-sm" />
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
            
            <div className="flex justify-center space-x-2 mt-6 sm:mt-8">
              {testimonials.map((_, index) => (
                <button
                  key={`testimonial-btn-${index}`}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all duration-300 ${
                    index === currentTestimonial ? 'bg-white' : 'bg-white/30'
                  }`}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8 sm:mb-12 md:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-2 sm:mb-4">Our Journey</h2>
            <p className="text-lg sm:text-xl text-gray-600">Milestones that shaped our platform</p>
          </div>
          
          <div className="flex justify-center mb-6 sm:mb-8 md:mb-12">
            <img src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1715&q=80" alt="Company Timeline" className="w-full max-w-xs sm:max-w-2xl md:max-w-4xl h-64 object-cover rounded-xl" />
          </div>
          
          <div className="relative">
            <div className="hidden sm:block absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
            
            {timeline.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2, duration: 0.6 }}
                viewport={{ once: true }}
                className={`relative flex flex-col sm:flex-row items-center mb-8 sm:mb-16 ${
                  index % 2 === 0 ? 'sm:flex-row' : 'sm:flex-row-reverse'
                }`}
              >
                <div className={`w-full sm:w-1/2 mb-4 sm:mb-0 ${index % 2 === 0 ? 'sm:pr-6 md:pr-12' : 'sm:pl-6 md:pl-12'}`}>
                  <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 hover:shadow-2xl transition-shadow duration-300">
                    <div className="flex items-center mb-3 sm:mb-4">
                      <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-2 sm:p-3 rounded-lg mr-3 sm:mr-4">
                        <item.icon size={20} className="sm:text-2xl" />
                      </div>
                      <div>
                        <h3 className="text-xl sm:text-2xl font-bold text-gray-800">{item.title}</h3>
                        <span className="text-blue-600 font-semibold text-sm sm:text-base">{item.year}</span>
                      </div>
                    </div>
                    <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">{item.description}</p>
                    <p className="text-xs sm:text-sm font-semibold text-green-600">{item.stats}</p>
                  </div>
                </div>
                
                <div className="absolute left-1/2 transform -translate-x-1/2 w-3 h-3 sm:w-4 sm:h-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full border-2 sm:border-4 border-white shadow-lg hidden sm:block"></div>
                
                <div className={`w-full sm:w-1/2 ${index % 2 === 0 ? 'sm:pl-6 md:pl-12' : 'sm:pr-6 md:pr-12'}`}>
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-40 sm:h-48 object-cover rounded-xl shadow-lg"
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-20 bg-gradient-to-r from-gray-900 to-gray-800 text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6">
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6">Ready to Make Your Mark?</h2>
            <p className="text-lg sm:text-xl text-gray-300 mb-6 sm:mb-8 leading-relaxed">
              Join thousands of creators and backers who are already making a difference. 
              Start your journey today and turn your ideas into reality.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Link
                to={isAuthenticated ? "/create-campaign" : "/register"}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full font-semibold text-base sm:text-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                {isAuthenticated ? "Start Your Campaign" : "Join DreamLift"}
                <FaRocket className="inline ml-2" />
              </Link>
              <Link
                to="/campaigns"
                className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-gray-900 px-6 sm:px-8 py-3 sm:py-4 rounded-full font-semibold text-base sm:text-lg transition-all duration-300"
              >
                Explore Campaigns
                <FaArrowRight className="inline ml-2" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {loading && (
        <div className="flex justify-center items-center py-20">
          <LoadingSpinner />
        </div>
      )}
    </div>
  );
};

export default Home;