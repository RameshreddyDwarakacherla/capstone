# 🚀 Deployment Guide - Civic Issue Reporter

Your application is production-ready! Here's how to deploy it to various platforms.

## Prerequisites

1. **Environment Variables Setup**
   - Copy `.env.example` to `.env` in backend
   - Add your actual API keys and secrets
   - Ensure MongoDB Atlas connection string is configured

2. **Services Required**
   - MongoDB Atlas (Database)
   - Cloudinary (Image Storage)
   - OpenAI API (AI Features)

## Option 1: Quick Deploy (Recommended)

### Frontend: Vercel
```bash
cd frontend
npm run build
# Connect GitHub repo to Vercel dashboard
# Deploy automatically on commits
```

### Backend: Render
```bash
cd backend
# Connect GitHub repo to Render dashboard
# Set environment variables in Render dashboard
# Deploy automatically
```

### Environment Variables for Production:
```
NODE_ENV=production
MONGODB_URI=your_mongodb_atlas_connection
JWT_SECRET=your_strong_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
OPENAI_API_KEY=your_openai_key
FRONTEND_URL=https://your-frontend-domain.vercel.app
```

## Option 2: Alternative Platforms

### Frontend Options:
- **Netlify** - Great for React apps
- **GitHub Pages** - Free static hosting
- **Firebase Hosting** - Google's platform

### Backend Options:
- **Railway** - Simple deployment
- **Heroku** - Classic platform (with add-ons)
- **AWS Elastic Beanstalk** - Scalable option
- **DigitalOcean App Platform** - Developer-friendly

## Option 3: Self-Hosted (VPS)

### Using PM2 on Ubuntu/CentOS:
```bash
# Install Node.js and PM2
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2

# Deploy backend
cd backend
npm install --production
pm2 start server.js --name civic-api

# Deploy frontend (build and serve with nginx)
cd frontend
npm run build
sudo cp -r build/* /var/www/html/

# Setup nginx reverse proxy for API
```

## Database Setup (MongoDB Atlas)

1. Create MongoDB Atlas account
2. Create new cluster
3. Set up database user
4. Whitelist IP addresses (0.0.0.0/0 for development)
5. Get connection string and add to environment variables

## Image Storage (Cloudinary)

1. Create Cloudinary account
2. Get API credentials from dashboard
3. Create upload preset for unsigned uploads
4. Add credentials to environment variables

## AI Features (OpenAI)

1. Create OpenAI account
2. Generate API key
3. Add to environment variables
4. Monitor usage and set limits

## Production Checklist

### Security
- ✅ Strong JWT secrets (64+ characters)
- ✅ CORS configured for production domain
- ✅ Rate limiting enabled
- ✅ Helmet.js security headers
- ✅ Input validation on all endpoints
- ✅ MongoDB connection with authentication

### Performance
- ✅ Image optimization (Sharp)
- ✅ Database indexes configured
- ✅ Cloudinary for image CDN
- ✅ Gzip compression enabled
- ✅ Frontend build optimization

### Monitoring
- ✅ Error logging (Winston)
- ✅ Health check endpoint (/api/health)
- ✅ Environment-specific logging
- ✅ API response monitoring

## Domain & SSL

### Custom Domain Setup:
1. Purchase domain from registrar
2. Point domain to deployment platform
3. Configure SSL certificate (automatic on most platforms)
4. Update FRONTEND_URL environment variable

### Example DNS Configuration:
```
A     @              your-app-ip-address
CNAME www            your-app-domain.com
CNAME api            your-backend-domain.com
```

## Testing Production Deploy

### Pre-deployment Tests:
```bash
# Test backend API
curl https://your-api-domain.com/api/health

# Test frontend
curl https://your-frontend-domain.com

# Test image upload
# Test AI features
# Test authentication flow
# Test mobile responsiveness
```

## Scaling Considerations

### When you need to scale:
- **Database**: MongoDB Atlas auto-scaling
- **Backend**: Load balancer + multiple instances
- **Frontend**: CDN distribution
- **Images**: Cloudinary handles CDN automatically
- **Caching**: Redis for session management

## Backup Strategy

- MongoDB Atlas: Automated backups enabled
- Code: Git repositories (already done)
- Images: Cloudinary handles redundancy
- Environment configs: Secure backup of .env files

## Go Live! 🎉

Once deployed:
1. Test all features in production
2. Monitor logs for any issues
3. Set up analytics (optional)
4. Share with users and gather feedback

Your civic issue reporting platform is now live and helping communities! 🏙️✨