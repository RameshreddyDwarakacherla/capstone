const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  analyzeImage,
  categorizeIssue,
  generateResolutionSuggestions,
  healthCheck,
  getStats,
  generateWeeklyReport
} = require('../controllers/aiController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');

// Rate limiting for AI endpoints
const rateLimit = require('express-rate-limit');

const aiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 requests per windowMs for AI endpoints
  message: {
    success: false,
    message: 'Too many AI requests from this IP, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Apply rate limiting to all AI routes
router.use(aiRateLimit);

// Image analysis endpoint
router.post('/analyze-image', [
  authenticateToken,
  body('image')
    .notEmpty()
    .withMessage('Image data is required')
    .isBase64()
    .withMessage('Image must be valid base64 data'),
  body('filename')
    .optional()
    .isString()
    .withMessage('Filename must be a string'),
  body('fileType')
    .optional()
    .isString()
    .matches(/^image\/(jpeg|jpg|png|webp)$/)
    .withMessage('File type must be a supported image format'),
  handleValidationErrors
], analyzeImage);

// Issue categorization endpoint
router.post('/categorize-issue', [
  authenticateToken,
  body('description')
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters'),
  body('imageAnalyses')
    .optional()
    .isArray()
    .withMessage('Image analyses must be an array'),
  body('context')
    .optional()
    .isString()
    .withMessage('Context must be a string'),
  handleValidationErrors
], categorizeIssue);

// Resolution suggestions endpoint
router.post('/resolution-suggestions', [
  authenticateToken,
  body('category')
    .notEmpty()
    .withMessage('Category is required')
    .isIn([
      'pothole', 'street_light', 'drainage', 'traffic_signal', 
      'road_damage', 'sidewalk', 'graffiti', 'garbage', 
      'water_leak', 'park_maintenance', 'noise_complaint', 'other'
    ])
    .withMessage('Invalid category'),
  body('description')
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority level'),
  body('location')
    .optional()
    .isObject()
    .withMessage('Location must be an object'),
  handleValidationErrors
], generateResolutionSuggestions);

// Health check endpoint (public)
router.get('/health', healthCheck);

// Statistics endpoint (admin only)
router.get('/stats', [
  authenticateToken,
  requireAdmin
], getStats);

// Weekly report generation endpoint (admin only)
router.get('/weekly-report', [
  authenticateToken,
  requireAdmin
], generateWeeklyReport);

// Batch image analysis endpoint
router.post('/analyze-images-batch', [
  authenticateToken,
  body('images')
    .isArray({ min: 1, max: 5 })
    .withMessage('Images array must contain 1-5 items'),
  body('images.*.image')
    .notEmpty()
    .withMessage('Each image must have image data')
    .isBase64()
    .withMessage('Each image must be valid base64 data'),
  body('images.*.filename')
    .optional()
    .isString()
    .withMessage('Filename must be a string'),
  body('images.*.fileType')
    .optional()
    .isString()
    .matches(/^image\/(jpeg|jpg|png|webp)$/)
    .withMessage('File type must be a supported image format'),
  handleValidationErrors
], async (req, res, next) => {
  try {
    const { images } = req.body;
    const analyses = [];

    // Process images sequentially to avoid overwhelming the API
    for (const imageData of images) {
      req.body = imageData; // Set current image data
      
      // Create a mock response object to capture the analysis
      const mockRes = {
        status: () => mockRes,
        json: (data) => {
          if (data.success) {
            analyses.push(data.data);
          }
          return mockRes;
        }
      };

      // Call the analyzeImage function
      await analyzeImage(req, mockRes, next);
    }

    res.status(200).json({
      success: true,
      data: {
        analyses,
        count: analyses.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
});

// AI service configuration endpoint (admin only)
router.get('/config', [
  authenticateToken,
  requireAdmin
], (req, res) => {
  const config = {
    services: {
      openai: {
        enabled: !!process.env.OPENAI_API_KEY,
        models: process.env.OPENAI_API_KEY ? [
          'gpt-4-vision-preview',
          'gpt-3.5-turbo'
        ] : []
      }
    },
    features: {
      imageAnalysis: !!process.env.OPENAI_API_KEY,
      categorization: true,
      resolutionSuggestions: true,
      batchProcessing: true
    },
    limits: {
      maxImageSize: 5 * 1024 * 1024, // 5MB
      maxBatchSize: 5,
      supportedFormats: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    },
    rateLimit: {
      windowMs: 15 * 60 * 1000,
      max: 50
    }
  };

  res.status(200).json({
    success: true,
    data: config
  });
});

// Test endpoint for development (remove in production)
if (process.env.NODE_ENV === 'development') {
  router.post('/test', [
    authenticateToken,
    body('test')
      .optional()
      .isString()
      .withMessage('Test parameter must be a string'),
    handleValidationErrors
  ], (req, res) => {
    res.status(200).json({
      success: true,
      data: {
        message: 'AI service test endpoint',
        timestamp: new Date().toISOString(),
        user: req.user._id,
        body: req.body
      }
    });
  });
}

module.exports = router;