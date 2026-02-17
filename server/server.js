// server/server.js
import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import hpp from 'hpp';
import compression from 'compression';
import { createServer } from 'http';
import { Server } from 'socket.io';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/auth.js';
import campaignRoutes from './routes/campaign.js';
import donationRoutes from './routes/donation.js';
import commentRoutes from './routes/comment.js';
import notificationRoutes from './routes/notification.js';
import userRoutes from './routes/user.js';
import paymentRoutes from './routes/payment.js';
import adminRoutes from './routes/admin.js';

// Import middleware
import { errorHandler, notFound } from './middleware/error.js';
import { handleUnhandledRejection, handleUncaughtException } from './middleware/error.js';
import monthlyEmailService from './utils/monthlyEmailService.js';

const app = express();
const server = createServer(app);

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: [process.env.CLIENT_URL || "http://localhost:3000", "http://localhost:3001"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"]
  }
});

// Make io globally accessible
global.io = io;

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

// Security middleware
app.use(helmet());
app.use(mongoSanitize());
app.use(xss());
app.use(hpp());

// Request timeout middleware - must be before other middleware
app.use((req, res, next) => {
  // Set timeout for all requests (30 seconds)
  req.setTimeout(30000, () => {
    const err = new Error('Request timeout');
    err.status = 408;
    next(err);
  });
  
  // Set response timeout
  res.setTimeout(30000, () => {
    if (!res.headersSent) {
      res.status(408).json({
        success: false,
        message: 'Request timeout - server took too long to respond'
      });
    }
  });
  
  next();
});

// Rate limiting with proper validation configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  validate: {
    xForwardedForHeader: false, // Disable X-Forwarded-For validation
    trustProxy: false // Disable trust proxy validation
  }
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// CORS configuration - handle preflight requests first
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    process.env.CLIENT_URL || "http://localhost:3000", 
    "http://localhost:3001",
    "http://localhost:3000"
  ];
  
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Max-Age', '86400'); // 24 hours
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.CLIENT_URL || "http://localhost:3000", 
      "http://localhost:3001",
      "http://localhost:3000"
    ];
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  optionsSuccessStatus: 200
}));


// Placeholder image service
app.get('/api/placeholder/:width/:height', (req, res) => {
  const { width, height } = req.params;
  const w = parseInt(width) || 400;
  const h = parseInt(height) || 300;
  
  // Generate a simple SVG placeholder
  const svg = `
    <svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#e5e7eb"/>
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="16" fill="#9ca3af" text-anchor="middle" dy=".3em">
        ${w} × ${h}
      </text>
    </svg>
  `;
  
  // Set CORS headers for images
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
  res.send(svg);
});

// Routes
// Routes with /api prefix
app.use('/api/auth', authRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join user room for notifications
  socket.on('join-user', (userId) => {
    socket.join(`user-${userId}`);
    console.log(`User ${socket.id} joined user room ${userId}`);
  });

  // Join campaign room
  socket.on('join-campaign', (campaignId) => {
    socket.join(`campaign-${campaignId}`);
    console.log(`User ${socket.id} joined campaign ${campaignId}`);
  });

  // Leave campaign room
  socket.on('leave-campaign', (campaignId) => {
    socket.leave(`campaign-${campaignId}`);
    console.log(`User ${socket.id} left campaign ${campaignId}`);
  });

  // Handle donation notifications
  socket.on('donation-made', (data) => {
    io.to(`campaign-${data.campaignId}`).emit('new-donation', data);
  });

  // Handle campaign updates
  socket.on('campaign-updated', (data) => {
    io.to(`campaign-${data.campaignId}`).emit('campaign-update', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Make io accessible to routes
app.set('io', io);

// Not found middleware
app.use(notFound);

// Error handling middleware
app.use(errorHandler);

// Handle unhandled promise rejections
process.on('unhandledRejection', handleUnhandledRejection);

// Handle uncaught exceptions
process.on('uncaughtException', handleUncaughtException);

// Connect to MongoDB
console.log('Attempting to connect to MongoDB at:', process.env.MONGO_URI);
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    
    // Start monthly email service
    monthlyEmailService.start();
    console.log('📧 Monthly email service started');
    
    // Start server
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📱 Environment: ${process.env.NODE_ENV}`);
      console.log(`🌐 Client URL: ${process.env.CLIENT_URL || 'http://localhost:3000'}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
    mongoose.connection.close(false, () => {
      process.exit(0);
    });
  });
});

export default app;
