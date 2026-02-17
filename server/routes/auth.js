// server/routes/auth.js
import express from 'express';
import {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  changePassword
} from '../controllers/authController.js';
import { protect, authRateLimit } from '../middleware/auth.js';
import { body } from 'express-validator';

const router = express.Router();

// Validation middleware
const validateRegister = [
  body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase, one lowercase, and one number')
];

const validateLogin = [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
];


// Routes
router.post('/register', validateRegister, register);
router.post('/login', authRateLimit, validateLogin, login);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);


const validateProfileUpdate = [
  body('name').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  body('bio').optional().trim().isLength({ max: 500 }).withMessage('Bio cannot exceed 500 characters'),
  body('phone').optional().matches(/^[0-9]{10}$/).withMessage('Please provide a valid 10-digit phone number')
];


// Protected routes
router.put('/change-password', protect, changePassword);



// Protected routes
router.get('/me', protect, getMe);
router.put('/profile', protect, validateProfileUpdate, updateProfile);

router.post('/logout', protect, logout);

export default router;
