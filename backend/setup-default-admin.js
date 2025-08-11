const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

// Default admin credentials
const DEFAULT_ADMIN = {
  firstName: 'Admin',
  lastName: 'User',
  email: 'admin@civic.com',
  password: 'admin123',
  role: 'admin',
  isActive: true,
  isEmailVerified: true, // Pre-verify the admin account
  phone: '+1-555-0100',
  address: {
    street: '123 Admin Street',
    city: 'Admin City',
    state: 'AC',
    zipCode: '12345',
    country: 'USA'
  }
};

async function setupDefaultAdmin() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Check if default admin already exists
    const existingAdmin = await User.findByEmail(DEFAULT_ADMIN.email);
    
    if (existingAdmin) {
      console.log('⚠️  Default admin user already exists');
      console.log('📧 Email:', DEFAULT_ADMIN.email);
      console.log('🔑 Password: admin123 (if not changed)');
      console.log('👤 Role:', existingAdmin.role);
      return;
    }

    // Create default admin user
    console.log('🔄 Creating default admin user...');
    const adminUser = new User(DEFAULT_ADMIN);
    await adminUser.save();

    console.log('✅ Default admin user created successfully!');
    console.log('');
    console.log('🔐 DEFAULT ADMIN CREDENTIALS:');
    console.log('📧 Email:', DEFAULT_ADMIN.email);
    console.log('🔑 Password:', DEFAULT_ADMIN.password);
    console.log('👤 Role: admin');
    console.log('');
    console.log('⚠️  IMPORTANT: Change the password after first login!');
    console.log('');
    console.log('🌐 Frontend URL: http://localhost:3000');
    console.log('🔗 Admin Login API: POST http://localhost:54112/api/auth/admin/login');
    console.log('');
    console.log('📝 Login Request Body:');
    console.log(JSON.stringify({
      email: DEFAULT_ADMIN.email,
      password: DEFAULT_ADMIN.password
    }, null, 2));

  } catch (error) {
    console.error('❌ Error setting up default admin:', error);
    
    if (error.code === 11000) {
      console.log('⚠️  Admin user with this email already exists');
    } else {
      console.log('Error details:', error.message);
    }
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the setup
if (require.main === module) {
  console.log('🚀 Setting up default admin user...');
  console.log('');
  setupDefaultAdmin().then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error('Setup failed:', error);
    process.exit(1);
  });
}

module.exports = { setupDefaultAdmin, DEFAULT_ADMIN };