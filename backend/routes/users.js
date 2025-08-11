const express = require('express');
const router = express.Router();

// Import controllers
const {
  getUsers,
  getUserById,
  updateUser,
  toggleUserStatus,
  deleteUser,
  getUserStats,
  getUserIssues,
  updateUserPreferences
} = require('../controllers/userController');

// Import middleware
const { authenticateToken, requireAdmin, requireOwnershipOrAdmin } = require('../middleware/auth');
const { validateObjectId } = require('../middleware/validation');

// All routes require authentication
router.use(authenticateToken);

// Admin-only routes
router.get('/', requireAdmin, getUsers);
router.get('/stats', requireAdmin, getUserStats);
router.get('/:id', requireAdmin, validateObjectId('id'), getUserById);
router.put('/:id', requireAdmin, validateObjectId('id'), updateUser);
router.patch('/:id/toggle-status', requireAdmin, validateObjectId('id'), toggleUserStatus);
router.delete('/:id', requireAdmin, validateObjectId('id'), deleteUser);

// User can view their own issues, admin can view any user's issues
router.get('/:id/issues', validateObjectId('id'), requireOwnershipOrAdmin('id'), getUserIssues);

// User preferences route
router.patch('/me/preferences', updateUserPreferences);

module.exports = router;