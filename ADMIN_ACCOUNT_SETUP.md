# Admin Account Management

## Overview
For security reasons, admin accounts cannot be created through the public web interface. Admin accounts must be created through backend scripts or direct database operations.

## Default Admin Account
The application comes with a pre-configured admin account:

- **Email**: `admin@civic.com`
- **Password**: `admin123`
- **Access**: http://localhost:3000/login-admin

⚠️ **IMPORTANT**: Change the default password immediately after first login!

## Creating Additional Admin Accounts

### Method 1: Using the Setup Script
```bash
# Navigate to backend directory
cd backend

# Edit the setup-default-admin.js file to create new admin
# Update the DEFAULT_ADMIN object with new admin details
# Then run:
node setup-default-admin.js
```

### Method 2: Direct Database Operation
Connect to your MongoDB database and create admin users manually:

```javascript
// Example MongoDB operation
db.users.insertOne({
  firstName: "New",
  lastName: "Admin",
  email: "newadmin@civic.com",
  password: "$2b$10$hashedPasswordHere", // Use bcrypt to hash the password
  role: "admin",
  isActive: true,
  isEmailVerified: true,
  createdAt: new Date(),
  updatedAt: new Date()
});
```

## Security Best Practices

1. **Strong Passwords**: Always use strong, unique passwords for admin accounts
2. **Limited Access**: Only create admin accounts for authorized personnel
3. **Regular Audits**: Periodically review and remove inactive admin accounts
4. **Environment Variables**: Never commit admin credentials to version control

## Admin Login
Once admin accounts are created, administrators can access the system via:
- **Admin Portal**: http://localhost:3000/login-admin

## Troubleshooting

### Forgot Admin Password
If you forget the admin password, you can reset it using the backend script:

```bash
cd backend
# Edit setup-default-admin.js with the new password
# Run the script to update the existing admin account
node setup-default-admin.js
```

### Account Locked
If an admin account gets locked due to failed login attempts, you can unlock it through direct database operation or by modifying the User model's `resetLoginAttempts` method.