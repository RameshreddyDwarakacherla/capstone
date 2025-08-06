const express = require('express');
const router = express.Router();

// Import controllers
const {
  createIssue,
  getIssues,
  getIssueById,
  updateIssue,
  deleteIssue,
  voteOnIssue,
  getIssueStats
} = require('../controllers/issueController');

// Import middleware
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { uploadMultiple } = require('../middleware/upload');
const { parseFormDataJSON } = require('../middleware/parseFormData');
const {
  validateIssueCreation,
  validateIssueUpdate,
  validateObjectId,
  validateIssueQuery
} = require('../middleware/validation');

// All routes require authentication
router.use(authenticateToken);

// Public routes (for authenticated users)
router.get('/', validateIssueQuery, getIssues);
router.get('/:id', validateObjectId('id'), getIssueById);

// User routes
router.post('/', uploadMultiple, parseFormDataJSON, validateIssueCreation, createIssue);
router.post('/:id/vote', validateObjectId('id'), [
  require('express-validator').body('voteType')
    .isIn(['up', 'down', 'remove'])
    .withMessage('Vote type must be up, down, or remove'),
  require('../middleware/validation').handleValidationErrors
], voteOnIssue);

// Admin-only routes
router.put('/:id', requireAdmin, validateObjectId('id'), validateIssueUpdate, updateIssue);
router.delete('/:id', requireAdmin, validateObjectId('id'), deleteIssue);
router.get('/stats/overview', requireAdmin, getIssueStats);

module.exports = router;