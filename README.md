# Civic Issue Reporter - Full Stack Application

A comprehensive civic issue reporting platform with AI integration, geolocation, and role-based access control.

## 🏗️ Architecture

- **Frontend**: React.js + TailwindCSS + Framer Motion
- **Backend**: Node.js + Express.js + MongoDB
- **Authentication**: JWT with Role-Based Access Control
- **AI Integration**: OpenAI Vision API for image description
- **Maps**: Leaflet.js for interactive maps
- **File Storage**: Cloudinary for image uploads
- **Deployment**: Vercel (Frontend) + Render (Backend)

## 🚀 Quick Start

### Backend Setup
```bash
cd backend
npm install
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

## 📁 Project Structure
```
capstone/
├── backend/                 # Node.js + Express API
│   ├── controllers/        # Route controllers
│   ├── middleware/         # Auth & validation middleware
│   ├── models/            # MongoDB models
│   ├── routes/            # API routes
│   ├── utils/             # Utility functions
│   └── uploads/           # Local file uploads
├── frontend/               # React application
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom hooks
│   │   ├── context/       # React context
│   │   ├── utils/         # Helper functions
│   │   └── styles/        # CSS files
└── docs/                  # Documentation
```

## 🔐 Authentication Flow

1. **User Registration**: `/signup-user` or `/signup-admin`
2. **Login**: `/login-user` or `/login-admin`
3. **JWT Tokens**: Access + Refresh token mechanism
4. **Role-Based Access**: Separate dashboards for users and admins

## 🎯 Key Features

- ✅ Dual authentication system (User/Admin)
- ✅ AI-powered image description generation
- ✅ Real-time geolocation capture
- ✅ Interactive maps with issue markers
- ✅ Mobile-responsive design with animations
- ✅ Image upload with preview
- ✅ Admin dashboard for issue management
- ✅ Status tracking and filtering
- ✅ Secure JWT authentication
- ✅ Rate limiting and input validation

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register-user` - User registration
- `POST /api/auth/register-admin` - Admin registration
- `POST /api/auth/login-user` - User login
- `POST /api/auth/login-admin` - Admin login
- `POST /api/auth/refresh` - Refresh JWT token

### Issues
- `GET /api/issues` - Get all issues (Admin only)
- `POST /api/issues` - Create new issue (User only)
- `PUT /api/issues/:id` - Update issue status (Admin only)
- `GET /api/issues/user` - Get user's issues

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile

## 🛠️ Environment Variables

### Backend (.env)
```
NODE_ENV=development
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
OPENAI_API_KEY=your_openai_key
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
```