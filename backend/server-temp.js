const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:54112',
    'http://localhost:54113',
    /^http:\/\/localhost:\d+$/ // Allow any localhost port for development
  ],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Static files
app.use('/uploads', express.static('uploads'));

// Health check endpoint (without database)
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Civic Reporter API is running (Database temporarily disabled)',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    database: 'Temporarily disabled - Configure MongoDB Atlas IP whitelist'
  });
});

// Temporary registration endpoint for testing
app.post('/api/auth/register', (req, res) => {
  res.status(503).json({
    success: false,
    message: 'Registration temporarily unavailable - Database connection required',
    error: 'Please configure MongoDB Atlas IP whitelist first',
    instructions: 'Go to MongoDB Atlas → Network Access → Add your IP address'
  });
});

// Temporary login endpoint for testing
app.post('/api/auth/login', (req, res) => {
  res.status(503).json({
    success: false,
    message: 'Login temporarily unavailable - Database connection required',
    error: 'Please configure MongoDB Atlas IP whitelist first',
    instructions: 'Go to MongoDB Atlas → Network Access → Add your IP address'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Internal Server Error'
  });
});

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`🚀 Backend Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV}`);
  console.log(`🌐 API URL: http://localhost:${PORT}/api`);
  console.log(`⚠️  Database temporarily disabled`);
  console.log(`💡 Configure MongoDB Atlas IP whitelist to enable full functionality`);
});

module.exports = app;