import User from '../models/User.js';
import { generateToken } from '../middleware/auth.js';
import { sendSuccessResponse, sendErrorResponse, asyncHandler } from '../middleware/error.js';
import { validationResult } from 'express-validator';


// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const register = asyncHandler(async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(error => error.msg);
      return sendErrorResponse(res, errorMessages.join(', '), 400);
    }

    const { name, email, password, referralCode } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return sendErrorResponse(res, 'User already exists with this email', 400);
    }

    // Create user with email verification disabled
    const user = await User.create({
      name,
      email,
      password,
      role: 'user',
      emailVerified: true,  // Set as verified by default
      isVerified: true      // Set as verified by default
    });

    // Handle referral
    if (referralCode) {
      const referredBy = await User.findOne({ referralCode });
      if (referredBy) {
        user.referredBy = referredBy._id;
        referredBy.referralCount += 1;
        await user.save();
        await referredBy.save();
      }
    }

    // Generate token
    const token = generateToken(user._id);


    // Removed: await sendVerificationEmail(user);

    sendSuccessResponse(res, {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        referralCode: user.referralCode
      },
      token
    }, 'Registration successful', 201);
  } catch (error) {
    console.error('Registration error:', error);
    return sendErrorResponse(res, 'Registration failed: ' + error.message, 500);
  }
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = asyncHandler(async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(error => error.msg);
      return sendErrorResponse(res, errorMessages.join(', '), 400);
    }

    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return sendErrorResponse(res, 'Please provide email and password', 400);
    }

    // Check for special admin credentials
    if (email === 'admin@dreamlift.com' && password === 'Admin@123') {
      // Check if admin user already exists
      let adminUser = await User.findOne({ email: 'admin@dreamlift.com' });
      
      if (!adminUser) {
        // Create admin user if doesn't exist
        adminUser = new User({
          name: 'Admin',
          email: 'admin@dreamlift.com',
          password: 'Admin@123',
          role: 'admin',
          isVerified: true,
          emailVerified: true
        });
        await adminUser.save();
      } else if (adminUser.role !== 'admin') {
        // Update existing user to admin role
        adminUser.role = 'admin';
        adminUser.isVerified = true;
        adminUser.emailVerified = true;
        await adminUser.save();
      }
      
      // Update last login
      adminUser.lastLogin = new Date();
      await adminUser.save();
      
      // Generate token
      const token = generateToken(adminUser._id);
      
      return sendSuccessResponse(res, {
        user: {
          _id: adminUser._id,
          name: adminUser.name,
          email: adminUser.email,
          role: adminUser.role,
          isVerified: adminUser.isVerified,
          emailVerified: adminUser.emailVerified,
          avatar: adminUser.avatar,
          twoFactorEnabled: adminUser.twoFactorEnabled || false
        },
        token,
        redirectTo: '/admin'
      }, 'Admin login successful');
    }

    // Check if user exists - explicitly select password field
    const user = await User.findOne({ email }).select('+password +loginAttempts +lockUntil');
    
    if (!user) {
      return sendErrorResponse(res, 'Invalid email or password', 401);
    }
    
    // Check if account is locked
    if (user.isLocked && user.isLocked()) {
      const lockTimeRemaining = Math.ceil((user.lockUntil - Date.now()) / (1000 * 60)); // minutes
      return sendErrorResponse(res, `Account is temporarily locked. Try again in ${lockTimeRemaining} minutes.`, 423);
    }
  
    // Check password
    const isPasswordCorrect = await user.correctPassword(password, user.password);
    
    if (!isPasswordCorrect) {
      // Increment login attempts
      await user.incLoginAttempts();
      
      // Check if account should be locked after this attempt
      const updatedUser = await User.findById(user._id).select('+loginAttempts +lockUntil');
      if (updatedUser.isLocked && updatedUser.isLocked()) {
        return sendErrorResponse(res, 'Too many failed login attempts. Account has been temporarily locked.', 423);
      }
      
      const attemptsLeft = 5 - (updatedUser.loginAttempts || 0);
      return sendErrorResponse(res, `Invalid email or password. ${attemptsLeft} attempts remaining.`, 401);
    }
    
    // Reset login attempts on successful login
    if (user.loginAttempts > 0) {
      user.loginAttempts = 0;
      user.lockUntil = undefined;
      await user.save();
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    sendSuccessResponse(res, {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        emailVerified: user.emailVerified,
        avatar: user.avatar,
        twoFactorEnabled: user.twoFactorEnabled
      },
      token
    }, 'Login successful');
  } catch (error) {
    return sendErrorResponse(res, 'Login failed: ' + error.message, 500);
  }
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .select('-password');

  sendSuccessResponse(res, { user });
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = asyncHandler(async (req, res) => {
  const { name, bio, phone, address, socialLinks } = req.body;

  const user = await User.findById(req.user._id);
  if (!user) {
    return sendErrorResponse(res, 'User not found', 404);
  }

  // Update fields
  if (name) user.name = name;
  if (bio) user.bio = bio;
  if (phone) user.phone = phone;
  if (address) user.address = address;
  if (socialLinks) user.socialLinks = socialLinks;

  await user.save();

  sendSuccessResponse(res, { user }, 'Profile updated successfully');
});


// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');
  if (!user) {
    return sendErrorResponse(res, 'User not found', 404);
  }

  // Check current password
  const isPasswordCorrect = await user.correctPassword(currentPassword, user.password);
  if (!isPasswordCorrect) {
    return sendErrorResponse(res, 'Current password is incorrect', 400);
  }

  // Update password
  user.password = newPassword;
  await user.save();

  sendSuccessResponse(res, null, 'Password changed successfully');
});


export const logout = asyncHandler(async (req, res) => {
  // In a real application, you might want to blacklist the token
  // For now, we'll just send a success response
  sendSuccessResponse(res, null, 'Logged out successfully');
});
