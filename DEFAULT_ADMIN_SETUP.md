# Default Admin Login Setup ✅

## Overview
A default admin account has been successfully created in your Civic Issue Reporter application. You can now login as an administrator without needing to register.

## 🔐 Default Admin Credentials

| Field    | Value                |
|----------|----------------------|
| Email    | `admin@civic.com`    |
| Password | `admin123`           |
| Role     | Admin                |

## 🌐 How to Login

### Option 1: Using the Frontend (Recommended)
1. Start your backend server:
   ```bash
   cd backend
   npm run dev
   ```

2. Start your frontend server:
   ```bash
   cd frontend  
   npm start
   ```

3. Open your browser and go to: **http://localhost:3000/login-admin**

4. Enter the credentials:
   - **Email**: `admin@civic.com`
   - **Password**: `admin123`

5. Click "Sign In as Admin"

### Option 2: Using API Directly
```bash
curl -X POST http://localhost:54112/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@civic.com",
    "password": "admin123"
  }'
```

## 🎯 Admin Dashboard Access
After successful login, you'll be redirected to the admin dashboard with access to:

- **Admin Dashboard**: `/admin`
- **Issues Management**: `/admin/issues`  
- **Map View**: `/admin/map`
- **Admin Settings**: `/admin/settings`

## 🔧 Testing Your Setup

Run the test script to verify everything works:
```bash
cd backend
node test-admin-login-default.js
```

## ⚠️ Security Recommendations

1. **Change the default password immediately** after your first login
2. The default admin email is `admin@civic.com` - consider changing this too
3. In production, always use strong, unique passwords

## 📁 Files Created

- `backend/setup-default-admin.js` - Script to create/recreate the default admin
- `backend/test-admin-login-default.js` - Test script to verify admin login
- `DEFAULT_ADMIN_SETUP.md` - This documentation

## 🚀 Quick Start Commands

Start both servers at once:
```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend  
cd frontend && npm start
```

Then visit: **http://localhost:3000/login-admin**

---

## 🎉 You're Ready!

Your default admin login is now set up and ready to use. The admin portal includes a beautiful, professional interface with:

- ✅ Secure authentication
- ✅ Role-based access control
- ✅ Professional admin dashboard
- ✅ Issue management capabilities
- ✅ Interactive map view
- ✅ Settings management

**Default Login URL**: http://localhost:3000/login-admin