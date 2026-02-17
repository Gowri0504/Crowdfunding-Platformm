import React from 'react';
import { motion } from 'framer-motion';
import { FaHeart, FaUsers, FaGlobe, FaShieldAlt, FaRocket, FaHandshake } from 'react-icons/fa';
import homeCommunity from '../../assets/home-community.svg';
import placeholderAvatar from '../../assets/placeholder-avatar.svg';
import vadakkan from '../../assets/vadakkan.jpg';


const About = () => {
  const stats = [
    { label: 'Campaigns Funded', value: '10,000+', icon: FaRocket },
    { label: 'Total Raised', value: '₹50M+', icon: FaHeart },
    { label: 'Active Users', value: '100K+', icon: FaUsers },
    { label: 'Countries', value: '25+', icon: FaGlobe }
  ];

  const values = [
    {
      icon: FaHeart,
      title: 'Compassion',
      description: 'We believe in the power of human kindness and the impact of collective giving.'
    },
    {
      icon: FaShieldAlt,
      title: 'Trust',
      description: 'Transparency and security are at the core of everything we do.'
    },
    {
      icon: FaUsers,
      title: 'Community',
      description: 'Building connections between dreamers and supporters worldwide.'
    },
    {
      icon: FaRocket,
      title: 'Innovation',
      description: 'Constantly improving our platform to serve you better.'
    }
  ];

  const team = [
    {
      name: 'Dharmaraj A',
      role: 'CEO & Founder',
      image: 'data:image/jpeg;base64,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',
      bio: 'Former tech executive with a passion for social impact.'
    },
    {
      name: 'Poongodi D',
      role: 'CTO',
      image: 'data:image/jpeg;base64,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',
      bio: 'Full-stack developer with 10+ years in fintech.'
    },
    {
      name: 'Gayathri D',
      role: 'Head of Community',
      image: 'data:image/jpeg;base64,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',
      bio: 'Community builder dedicated to connecting people with causes.'
    },
    {
      name: 'Karthik Raj D',
      role: 'Head of Security',
      image: vadakkan,
      bio: 'Cybersecurity expert ensuring platform safety.'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-600 to-secondary-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              About DreamLift
            </h1>
            <p className="text-xl md:text-2xl text-primary-100 max-w-3xl mx-auto">
              Empowering dreams, connecting communities, and making the impossible possible through the power of crowdfunding.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
              <p className="text-lg text-gray-600 mb-6">
                At DreamLift, we believe that every great idea deserves a chance to become reality. 
                Our mission is to democratize funding and create a world where innovation, creativity, 
                and social impact are limited only by imagination, not by access to capital.
              </p>
              <p className="text-lg text-gray-600">
                We're building more than just a platform – we're fostering a global community of 
                dreamers, creators, and supporters who believe in the power of collective action 
                to create positive change.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <img
                src={homeCommunity}
                alt="Our Mission"
                className="rounded-lg shadow-lg"
              />
              <div className="absolute inset-0 bg-primary-600 opacity-10 rounded-lg"></div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Impact</h2>
            <p className="text-lg text-gray-600">
              Numbers that tell our story of success and community impact
            </p>
          </motion.div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <stat.icon className="w-8 h-8 text-primary-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
                <div className="text-gray-600">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Values</h2>
            <p className="text-lg text-gray-600">
              The principles that guide everything we do
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                  <value.icon className="w-6 h-6 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Meet Our Team</h2>
            <p className="text-lg text-gray-600">
              The passionate people behind DreamLift
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center"
              >
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-32 h-32 rounded-full mx-auto mb-4 object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.style.display = 'none';
                    e.target.parentNode.innerHTML = '<div class="w-32 h-32 rounded-full mx-auto mb-4 bg-gray-200 flex items-center justify-center"><span class="text-gray-500 text-sm">Photo not available</span></div>';
                  }}
                />
                <h3 className="text-xl font-semibold text-gray-900 mb-1">{member.name}</h3>
                <p className="text-primary-600 font-medium mb-2">{member.role}</p>
                <p className="text-gray-600 text-sm">{member.bio}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Join Our Community?
            </h2>
            <p className="text-xl text-primary-100 mb-8">
              Whether you're a creator with a vision or a supporter looking to make an impact, 
              we'd love to have you on board.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/register"
                className="btn bg-white text-primary-600 hover:bg-gray-100"
              >
                Get Started Today
              </a>
              <a
                href="/contact"
                className="btn border-white text-white hover:bg-white hover:text-primary-600"
              >
                Contact Us
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default About;