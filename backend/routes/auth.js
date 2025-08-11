const express = require('express');
const router = express.Router();

// Import controllers
const {
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
} = require('../controllers/authController');

// Import middleware
const { authenticateToken } = require('../middleware/auth');
const {
  validateUserRegistration,
  validateUserLogin,
  handleValidationErrors
} = require('../middleware/validation');

// Public routes
router.post('/register', validateUserRegistration, register);
router.post('/login', validateUserLogin, login);
router.post('/refresh-token', refreshToken);

// Email verification and password reset routes
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerificationEmail);
router.post('/request-password-reset', requestPasswordReset);
router.post('/reset-password', resetPassword);

// Admin registration disabled for security - use setup-default-admin.js script instead
// router.post('/admin/register', validateUserRegistration, (req, res, next) => {
//   req.body.role = 'admin';
//   next();
// }, register);

router.post('/admin/login', validateUserLogin, (req, res, next) => {
  req.body.expectedRole = 'admin';
  next();
}, login);

// Protected routes (require authentication)
router.use(authenticateToken);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.post('/logout', logout);
router.post('/logout-all', logoutAll);
router.put('/change-password', [
  require('express-validator').body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  require('express-validator').body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  handleValidationErrors
], changePassword);

module.exports = router;