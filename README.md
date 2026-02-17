# 🚀 Crowdfunding Platform - DreamLift

A full-featured crowdfunding platform built with the **MERN Stack (MongoDB, Express, React, Node.js)** featuring modern UI/UX, real-time updates, payment integration, and comprehensive campaign management.

## 🌟 Features

### 👤 **User Authentication & Management**
- ✅ JWT-based authentication with refresh tokens
- ✅ Social login (Google, GitHub) integration
- ✅ Two-Factor Authentication (2FA) with QR codes
- ✅ Email verification and password reset
- ✅ Account verification and KYC system
- ✅ Role-based access control (User, Creator, Admin)

### 📄 **User Profiles**
- ✅ Comprehensive user profiles with avatars
- ✅ Social media links and bio
- ✅ Donation history and statistics
- ✅ Verification badges and trust scores
- ✅ Referral system with rewards

### 💼 **Campaign Management**
- ✅ Create, edit, and manage campaigns
- ✅ Rich text editor for campaign stories
- ✅ Multiple image/video upload support
- ✅ Campaign categories and tags
- ✅ Campaign updates and announcements
- ✅ FAQ management system
- ✅ Campaign analytics and insights

### 🎯 **Campaign Features**
- ✅ Real-time progress tracking
- ✅ Donor wall with anonymous options
- ✅ Campaign updates and comments
- ✅ Social sharing integration
- ✅ Campaign expiration countdown
- ✅ Trending campaigns algorithm

### 💳 **Payment Integration**
- ✅ Razorpay integration (India)
- ✅ Stripe integration (Global)
- ✅ Multiple currency support
- ✅ Recurring donations
- ✅ Tax receipt generation
- ✅ Refund management system

### 💬 **Community Features**
- ✅ Comment system with moderation
- ✅ Like/dislike functionality
- ✅ Real-time notifications
- ✅ Private messaging system
- ✅ Community guidelines

### 📊 **Analytics & Insights**
- ✅ Campaign performance analytics
- ✅ Donor demographics
- ✅ Traffic source tracking
- ✅ Conversion rate analysis
- ✅ Real-time donation feed

### 🛡️ **Security Features**
- ✅ Rate limiting and DDoS protection
- ✅ Input sanitization and validation
- ✅ XSS and CSRF protection
- ✅ File upload security
- ✅ Fraud detection system

### 📱 **Progressive Web App (PWA)**
- ✅ Mobile-first responsive design
- ✅ Offline functionality
- ✅ Push notifications
- ✅ Installable on mobile devices

## 🛠️ Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Multer** - File uploads
- **Cloudinary** - Image storage
- **Socket.io** - Real-time communication
- **Nodemailer** - Email service
- **Razorpay/Stripe** - Payment gateways

### Frontend
- **React.js** - UI library
- **React Router** - Navigation
- **React Query** - State management
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **React Hook Form** - Form handling
- **Socket.io Client** - Real-time updates
- **React Hot Toast** - Notifications

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Nodemon** - Development server
- **Concurrently** - Run multiple commands

## 📦 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (v5 or higher)
- npm or yarn

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/crowdfunding-platform.git
cd crowdfunding-platform
```

### 2. Install Dependencies
```bash
# Install root dependencies
npm install

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGO_URI=mongodb://localhost:27017/crowdfunding-platform

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=30d

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Payment Gateway Configuration
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-secret-key
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Frontend URL
CLIENT_URL=http://localhost:3000
```

### 4. Database Setup
```bash
# Start MongoDB (if not running)
mongod

# The application will automatically create collections on first run
```

### 5. Start Development Servers
```bash
# From root directory
npm run dev

# Or start separately:
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client
npm start
```

### 6. Access the Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- API Documentation: http://localhost:5000/api/health

## 🚀 Deployment

### Backend Deployment (Railway/Render)
1. Push code to GitHub
2. Connect repository to Railway/Render
3. Set environment variables
4. Deploy

### Frontend Deployment (Vercel)
1. Push code to GitHub
2. Connect repository to Vercel
3. Set build command: `cd client && npm run build`
4. Deploy

### Database Deployment (MongoDB Atlas)
1. Create MongoDB Atlas cluster
2. Get connection string
3. Update `MONGO_URI` in environment variables

## 📚 API Documentation

### Authentication Endpoints
```
POST /api/auth/register - Register new user
POST /api/auth/login - User login
POST /api/auth/logout - User logout
GET /api/auth/me - Get current user
PUT /api/auth/profile - Update profile
POST /api/auth/forgot-password - Forgot password
PUT /api/auth/reset-password/:token - Reset password
POST /api/auth/setup-2fa - Setup 2FA
POST /api/auth/enable-2fa - Enable 2FA
```

### Campaign Endpoints
```
GET /api/campaigns - Get all campaigns
POST /api/campaigns - Create campaign
GET /api/campaigns/:id - Get campaign details
PUT /api/campaigns/:id - Update campaign
DELETE /api/campaigns/:id - Delete campaign
GET /api/campaigns/trending - Get trending campaigns
GET /api/campaigns/search - Search campaigns
GET /api/campaigns/category/:category - Get campaigns by category
```

### Donation Endpoints
```
POST /api/donations - Create donation
GET /api/donations/user - Get user donations
GET /api/donations/campaign/:id - Get campaign donations
POST /api/donations/:id/refund - Request refund
```

## 🎨 Customization

### Styling
- Modify `client/tailwind.config.js` for theme customization
- Update `client/src/index.css` for custom styles
- Use CSS variables for dynamic theming

### Features
- Add new campaign categories in `server/models/Campaign.js`
- Extend user roles in `server/models/User.js`
- Add new payment gateways in `server/controllers/paymentController.js`

### Localization
- Add language files in `client/src/locales/`
- Implement i18n using react-i18next
- Update text content throughout the application

## 🔧 Development

### Code Structure
```
├── server/                 # Backend code
│   ├── controllers/       # Route controllers
│   ├── middleware/        # Custom middleware
│   ├── models/           # Database models
│   ├── routes/           # API routes
│   ├── utils/            # Utility functions
│   └── server.js         # Main server file
├── client/                # Frontend code
│   ├── src/
│   │   ├── components/   # Reusable components
│   │   ├── contexts/     # React contexts
│   │   ├── hooks/        # Custom hooks
│   │   ├── pages/        # Page components
│   │   ├── services/     # API services
│   │   └── utils/        # Utility functions
│   └── public/           # Static assets
└── docs/                 # Documentation
```

### Scripts
```bash
# Development
npm run dev              # Start both servers
npm run server           # Start backend only
npm run client           # Start frontend only

# Production
npm run build            # Build frontend
npm start                # Start production server

# Code Quality
npm run lint             # Lint code
npm run lint:fix         # Fix linting issues
npm run format           # Format code
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style
- Use ESLint and Prettier for code formatting
- Follow React best practices
- Write meaningful commit messages
- Add tests for new features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Tailwind CSS](https://tailwindcss.com/) for styling
- [React Query](https://react-query.tanstack.com/) for state management
- [Framer Motion](https://www.framer.com/motion/) for animations
- [Socket.io](https://socket.io/) for real-time features
- [Cloudinary](https://cloudinary.com/) for image management

## 📞 Support

- 📧 Email: support@dreamlift.com
- 💬 Discord: [Join our community](https://discord.gg/dreamlift)
- 📖 Documentation: [Read the docs](https://docs.dreamlift.com)
- 🐛 Issues: [Report a bug](https://github.com/yourusername/crowdfunding-platform/issues)

---

**Made with ❤️ by the DreamLift Team**"# Crowdfunding-Platformm" 
#   C r o w d f u n d i n g - P l a t f o r m m  
 