const sampleCampaigns = [
  {
    id: '1',
    title: 'Clean Water Initiative',
    description: 'Providing clean drinking water to rural communities through sustainable filtration systems.',
    story: '<p>Access to clean water is a fundamental human right, yet millions around the world still lack this basic necessity. Our initiative aims to install water filtration systems in 50 villages across developing regions, directly impacting over 25,000 people.</p><p>These systems are sustainable, locally maintained, and built to last for decades with minimal maintenance. Each system costs approximately $2,000 to install and can provide clean water for an entire community.</p><p>Your donation will help fund the materials, installation, and training of local technicians who will maintain these systems for years to come.</p>',
    category: 'Environment',
    tags: ['water', 'sustainability', 'health'],
    target: 100000,
    amountRaised: 65400,
    currency: 'USD',
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
    location: 'Global',
    images: [
      'https://images.unsplash.com/photo-1541675154750-0444c7d51e8e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
      'https://images.unsplash.com/photo-1548576304-09c0b0f71d38?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80'
    ],
    video: 'https://www.youtube.com/watch?v=example',
    creator: {
      id: '101',
      name: 'Environmental Solutions NGO',
      avatar: 'https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
      bio: 'Working towards sustainable environmental solutions since 2005.'
    },
    faqs: [
      {
        question: 'How are the communities selected?',
        answer: 'We work with local governments and NGOs to identify communities with the greatest need and least access to clean water.'
      },
      {
        question: 'What percentage of my donation goes directly to the project?',
        answer: '90% of all donations go directly to project implementation. The remaining 10% covers administrative costs and awareness campaigns.'
      }
    ],
    updates: [
      {
        id: '1',
        title: 'First 10 Systems Installed!',
        content: 'We\'ve successfully installed the first 10 filtration systems, serving approximately 5,000 people.',
        date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
        images: ['https://images.unsplash.com/photo-1543076447-215ad9ba6923?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80']
      }
    ],
    donations: [
      {
        id: '1',
        donor: 'Anonymous',
        amount: 5000,
        message: 'Keep up the great work!',
        date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString() // 20 days ago
      },
      {
        id: '2',
        donor: 'Sarah Johnson',
        amount: 1000,
        message: 'Everyone deserves clean water.',
        date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() // 10 days ago
      },
      {
        id: '3',
        donor: 'Michael Chen',
        amount: 2500,
        message: 'Happy to support this initiative!',
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() // 5 days ago
      }
    ],
    status: 'active',
    verified: true
  },
  {
    id: '2',
    title: 'Tech Education for Underserved Youth',
    description: 'Providing computer science education and equipment to underserved communities to bridge the digital divide.',
    story: '<p>In today\'s digital world, computer literacy is essential for career success. Unfortunately, many schools in underserved communities lack the resources to provide adequate technology education.</p><p>Our program aims to establish computer labs in 25 schools, train teachers in computer science curriculum, and provide ongoing technical support. Each lab costs approximately $15,000 to set up and can serve hundreds of students annually.</p><p>Your donation will help purchase computers, software, educational materials, and fund teacher training programs.</p>',
    category: 'Education',
    tags: ['education', 'technology', 'youth'],
    target: 375000,
    amountRaised: 210000,
    currency: 'USD',
    deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(), // 45 days from now
    location: 'United States',
    images: [
      'https://images.unsplash.com/photo-1509062522246-3755977927d7?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
      'https://images.unsplash.com/photo-1526498460520-4c246339dccb?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80'
    ],
    video: 'https://www.youtube.com/watch?v=example2',
    creator: {
      id: '102',
      name: 'Future Tech Foundation',
      avatar: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
      bio: 'Dedicated to bringing technology education to all communities since 2010.'
    },
    faqs: [
      {
        question: 'How are schools selected for the program?',
        answer: 'We focus on schools in low-income areas with limited access to technology resources and high student interest.'
      },
      {
        question: 'What ages does the program serve?',
        answer: 'Our curriculum is designed for students from grades 6-12, with age-appropriate materials for different levels.'
      },
      {
        question: 'Do you provide ongoing support?',
        answer: 'Yes, we provide technical support and curriculum updates for 3 years after initial implementation.'
      }
    ],
    updates: [
      {
        id: '1',
        title: 'First 5 Computer Labs Completed!',
        content: 'We\'ve successfully set up computer labs in 5 schools, reaching over 1,500 students.',
        date: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(), // 25 days ago
        images: ['https://images.unsplash.com/photo-1571260899304-425eee4c7efc?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80']
      },
      {
        id: '2',
        title: 'Teacher Training Program Launched',
        content: 'We\'ve begun our teacher training program with 20 educators from participating schools.',
        date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
        images: ['https://images.unsplash.com/photo-1524178232363-1fb2b075b655?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80']
      }
    ],
    donations: [
      {
        id: '1',
        donor: 'Tech Solutions Inc.',
        amount: 50000,
        message: 'We believe in investing in future tech talent!',
        date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days ago
      },
      {
        id: '2',
        donor: 'David Wilson',
        amount: 5000,
        message: 'Education is the key to opportunity.',
        date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString() // 15 days ago
      },
      {
        id: '3',
        donor: 'Anonymous',
        amount: 10000,
        message: 'Happy to support tech education!',
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days ago
      },
      {
        id: '4',
        donor: 'Jennifer Lopez',
        amount: 2500,
        message: 'Every child deserves access to technology education.',
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days ago
      }
    ],
    status: 'active',
    verified: true
  }
];

export default sampleCampaigns;