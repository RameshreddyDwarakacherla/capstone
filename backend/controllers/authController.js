const User = require('../models/User');
const { generateTokenPair, verifyRefreshToken, verifySpecialToken } = require('../utils/jwt');
const crypto = require('crypto');
const emailService = require('../utils/emailService');

// Register new user
const register = async (req, res) => {
  try {
    const { firstName, lastName, email, password, phone, address, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create new user
    const userData = {
      firstName,
      lastName,
      email,
      password,
      phone,
      address,
      role: role === 'admin' ? 'admin' : 'user' // Only allow admin if explicitly set
    };

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    userData.emailVerificationToken = verificationToken;
    userData.emailVerificationExpires = verificationExpires;
    
    const user = new User(userData);
    await user.save();

    // Generate tokens
    const tokens = generateTokenPair(user._id, user.role);

    // Save refresh token to user record
    user.refreshTokens.push({
      token: tokens.refreshToken,
      expiresAt: tokens.refreshTokenExpires,
      userAgent: req.get('User-Agent'),
      ipAddress: req.ip
    });
    await user.save();
    
    // Send verification email if email service is configured
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      await emailService.sendVerificationEmail(user, verificationToken);
    }

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.refreshTokens;
    delete userResponse.emailVerificationToken;

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email to verify your account.',
      data: {
        user: userResponse,
        tokens
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    console.error('Registration error stack:', error.stack);
    
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: process.env.NODE_ENV === 'development' ? error.toString() : undefined,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password, expectedRole } = req.body;

    // Find user with password field
    const user = await User.findByEmail(email).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if account is locked
    if (user.isLocked) {
      return res.status(423).json({
        success: false,
        message: 'Account is temporarily locked due to failed login attempts'
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      // Increment login attempts
      await user.incLoginAttempts();
      
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check role-based access for admin login
    if (expectedRole === 'admin' && user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Admin credentials required.'
      });
    }

    // Reset login attempts on successful login
    if (user.loginAttempts > 0) {
      await user.resetLoginAttempts();
    }

    // Update last login
    user.lastLogin = new Date();

    // Generate tokens
    const tokens = generateTokenPair(user._id, user.role);

    // Clean up old refresh tokens (keep only last 5)
    if (user.refreshTokens.length >= 5) {
      user.refreshTokens = user.refreshTokens.slice(-4);
    }

    // Save new refresh token
    user.refreshTokens.push({
      token: tokens.refreshToken,
      expiresAt: tokens.refreshTokenExpires,
      userAgent: req.get('User-Agent'),
      ipAddress: req.ip
    });

    await user.save();

    // Remove sensitive data from response
    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.refreshTokens;

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userResponse,
        tokens
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Refresh access token
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token is required'
      });
    }

    // Verify refresh token
    const verification = verifyRefreshToken(refreshToken);
    if (!verification.valid) {
      return res.status(401).json({
        success: false,
        message: verification.error || 'Invalid refresh token'
      });
    }

    // Find user and check if refresh token exists in database
    const user = await User.findById(verification.decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    const storedToken = user.refreshTokens.find(
      token => token.token === refreshToken && token.expiresAt > new Date()
    );

    if (!storedToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token not found or expired'
      });
    }

    // Generate new token pair
    const tokens = generateTokenPair(user._id, user.role);

    // Remove old refresh token and add new one
    user.refreshTokens = user.refreshTokens.filter(token => token.token !== refreshToken);
    user.refreshTokens.push({
      token: tokens.refreshToken,
      expiresAt: tokens.refreshTokenExpires,
      userAgent: req.get('User-Agent'),
      ipAddress: req.ip
    });

    await user.save();

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: { tokens }
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      message: 'Token refresh failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Logout user
const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const user = req.user;

    if (refreshToken && user) {
      // Remove specific refresh token
      user.refreshTokens = user.refreshTokens.filter(
        token => token.token !== refreshToken
      );
      await user.save();
    }

    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Logout from all devices
const logoutAll = async (req, res) => {
  try {
    const user = req.user;

    // Clear all refresh tokens
    user.refreshTokens = [];
    await user.save();

    res.json({
      success: true,
      message: 'Logged out from all devices'
    });
  } catch (error) {
    console.error('Logout all error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get current user profile
const getProfile = async (req, res) => {
  try {
    const user = req.user;

    // Remove sensitive data
    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.refreshTokens;

    res.json({
      success: true,
      data: { user: userResponse }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const user = req.user;
    const updates = req.body;

    // Fields that can be updated
    const allowedUpdates = [
      'firstName', 'lastName', 'phone', 'address', 'preferences'
    ];

    // Filter updates to only allowed fields
    const filteredUpdates = {};
    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        filteredUpdates[field] = updates[field];
      }
    });

    // Update user
    Object.assign(user, filteredUpdates);
    await user.save();

    // Remove sensitive data from response
    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.refreshTokens;

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user: userResponse }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Profile update failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Change password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Clear all refresh tokens to force re-login on all devices
    user.refreshTokens = [];
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully. Please log in again.'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Password change failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Verify email with token
const verifyEmail = async (req, res) => {
  try {
    const { token, email } = req.body;

    if (!token || !email) {
      return res.status(400).json({
        success: false,
        message: 'Verification token and email are required'
      });
    }

    // Find user with the verification token
    const user = await User.findOne({
      email,
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token'
      });
    }

    // Mark email as verified and remove verification token
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Email verification failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Resend verification email
const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Find user by email
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if email is already verified
    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified'
      });
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpires = verificationExpires;
    await user.save();

    // Send verification email
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      await emailService.sendVerificationEmail(user, verificationToken);
    } else {
      return res.status(500).json({
        success: false,
        message: 'Email service not configured'
      });
    }

    res.json({
      success: true,
      message: 'Verification email sent successfully'
    });
  } catch (error) {
    console.error('Resend verification email error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resend verification email',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Request password reset
const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Find user by email
    const user = await User.findByEmail(email);
    if (!user) {
      // For security reasons, don't reveal that the user doesn't exist
      return res.json({
        success: true,
        message: 'If your email is registered, you will receive a password reset link'
      });
    }

    // Generate password reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    user.passwordResetToken = resetToken;
    user.passwordResetExpires = resetExpires;
    await user.save();

    // Send password reset email
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      await emailService.sendPasswordResetEmail(user, resetToken);
    } else {
      return res.status(500).json({
        success: false,
        message: 'Email service not configured'
      });
    }

    res.json({
      success: true,
      message: 'If your email is registered, you will receive a password reset link'
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process password reset request',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Reset password with token
const resetPassword = async (req, res) => {
  try {
    const { token, email, password } = req.body;

    if (!token || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Token, email, and new password are required'
      });
    }

    // Find user with the reset token
    const user = await User.findOne({
      email,
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() }
    }).select('+password');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Update password and clear reset token
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    
    // Clear all refresh tokens to force re-login with new password
    user.refreshTokens = [];
    
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successful. Please log in with your new password.'
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({
      success: false,
      message: 'Password reset failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  logoutAll,
  getProfile,
  updateProfile,
  changePassword,
  verifyEmail,
  resendVerificationEmail,
  requestPasswordReset,
  resetPassword
};