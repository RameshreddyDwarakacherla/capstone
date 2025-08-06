---
description: Repository Information Overview
alwaysApply: true
---

# Civic Issue Reporter Information

## Summary
A comprehensive civic issue reporting platform with AI integration, geolocation, and role-based access control. The application allows citizens to report civic issues with images, location data, and descriptions, while administrators can manage and update the status of these issues.

## Structure
- **backend/**: Node.js + Express API with MongoDB integration
  - **controllers/**: Route controllers for auth, issues, users, and AI
  - **middleware/**: Authentication, validation, and error handling
  - **models/**: MongoDB schemas for User and Issue
  - **routes/**: API endpoint definitions
  - **utils/**: Utility functions for JWT, cloudinary, and AI services
- **frontend/**: React application with TailwindCSS
  - **src/components/**: Reusable UI components
  - **src/pages/**: Page-level components
  - **src/contexts/**: React context providers
  - **src/hooks/**: Custom React hooks
  - **src/services/**: API service functions

## Projects

### Backend (Node.js API)
**Configuration File**: backend/package.json

#### Language & Runtime
**Language**: JavaScript (Node.js)
**Version**: Node.js 
**Package Manager**: npm
**Database**: MongoDB (Atlas)

#### Dependencies
**Main Dependencies**:
- express: ^4.18.2 - Web framework
- mongoose: ^7.6.3 - MongoDB ODM
- jsonwebtoken: ^9.0.2 - JWT authentication
- bcryptjs: ^2.4.3 - Password hashing
- multer: ^1.4.5-lts.1 - File uploads
- cloudinary: ^1.41.0 - Cloud image storage
- openai: ^4.104.0 - AI integration
- node-geocoder: ^4.2.0 - Geolocation services

**Development Dependencies**:
- nodemon: ^3.0.1 - Development server
- jest: ^29.7.0 - Testing framework
- supertest: ^6.3.3 - API testing

#### Build & Installation
```bash
cd backend
npm install
npm run dev
```

#### Testing
**Framework**: Jest
**Test Location**: No dedicated test directory found
**Run Command**:
```bash
npm test
```

### Frontend (React Application)
**Configuration File**: frontend/package.json

#### Language & Runtime
**Language**: JavaScript (React)
**Version**: React 18.2.0
**Package Manager**: npm
**Build Tool**: react-scripts (Create React App)

#### Dependencies
**Main Dependencies**:
- react: ^18.2.0 - UI library
- react-router-dom: ^6.20.1 - Routing
- axios: ^1.6.2 - HTTP client
- leaflet: ^1.9.4 - Maps integration
- react-leaflet: ^4.2.1 - React wrapper for Leaflet
- framer-motion: ^10.16.5 - Animations
- tailwindcss: ^3.3.6 - CSS framework

**Development Dependencies**:
- @tailwindcss/forms: ^0.5.10
- @tailwindcss/typography: ^0.5.16
- postcss: ^8.4.32
- autoprefixer: ^10.4.16

#### Build & Installation
```bash
cd frontend
npm install
npm start
```

#### Testing
**Framework**: Jest with React Testing Library
**Test Location**: src/App.test.js
**Run Command**:
```bash
npm test
```

## Database Configuration
**Type**: MongoDB Atlas
**Connection String**: mongodb+srv://[username]:[password]@parkingsystem.iy0l3.mongodb.net/capstone
**Models**:
- User: Authentication and user profile data
- Issue: Civic issue reports with geolocation and status

## API Endpoints
**Base URL**: http://localhost:5000/api

**Authentication**:
- POST /api/auth/register-user - User registration
- POST /api/auth/register-admin - Admin registration
- POST /api/auth/login-user - User login
- POST /api/auth/login-admin - Admin login

**Issues**:
- GET /api/issues - Get all issues (Admin only)
- POST /api/issues - Create new issue (User only)
- PUT /api/issues/:id - Update issue status (Admin only)
- GET /api/issues/user - Get user's issues

**Users**:
- GET /api/users/profile - Get user profile
- PUT /api/users/profile - Update user profile

## Environment Variables
**Backend (.env)**:
- NODE_ENV - Environment (development/production)
- PORT - Server port (default: 5000)
- MONGODB_URI - MongoDB connection string
- JWT_SECRET - Secret for JWT tokens
- JWT_REFRESH_SECRET - Secret for refresh tokens
- CLOUDINARY_* - Cloudinary configuration (optional)
- OPENAI_API_KEY - OpenAI API key (optional)

**Frontend (.env)**:
- REACT_APP_API_URL - Backend API URL