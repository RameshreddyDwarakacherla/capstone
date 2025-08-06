const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const User = require('./models/User');

async function testUserAuth() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Create a test user
    const testEmail = 'test@example.com';
    const testPassword = 'Test123!';

    // Check if test user exists
    let testUser = await User.findOne({ email: testEmail });

    if (!testUser) {
      console.log('📝 Creating test user...');
      const hashedPassword = await bcryptjs.hash(testPassword, 12);
      
      testUser = new User({
        firstName: 'Test',
        lastName: 'User',
        email: testEmail,
        password: hashedPassword,
        role: 'user',
        isActive: true
      });

      await testUser.save();
      console.log('✅ Test user created successfully');
    } else {
      console.log('👤 Test user already exists');
    }

    // Check if password exists and update if needed
    console.log('Password exists:', !!testUser.password);
    if (!testUser.password) {
      console.log('🔄 Setting password for existing user...');
      const hashedPassword = await bcryptjs.hash(testPassword, 12);
      testUser.password = hashedPassword;
      await testUser.save();
      console.log('✅ Password set');
    }

    // Test login credentials
    const isPasswordValid = await bcryptjs.compare(testPassword, testUser.password);
    console.log('🔐 Password validation:', isPasswordValid ? '✅ Valid' : '❌ Invalid');
    
    if (!isPasswordValid) {
      // Update password if validation fails (might be due to different hashing)
      console.log('🔄 Updating password...');
      const newHashedPassword = await bcryptjs.hash(testPassword, 12);
      testUser.password = newHashedPassword;
      await testUser.save();
      console.log('✅ Password updated');
    }

    // Generate tokens
    const accessToken = jwt.sign(
      { 
        userId: testUser._id,
        role: testUser.role,
        email: testUser.email
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '24h' }
    );

    const refreshToken = jwt.sign(
      { userId: testUser._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
    );

    console.log('🎟️ Generated tokens:');
    console.log('Access Token:', accessToken.substring(0, 50) + '...');
    console.log('Refresh Token:', refreshToken.substring(0, 50) + '...');

    // Test API call with authentication
    console.log('\n🧪 Testing API call...');
    const axios = require('axios');
    
    try {
      const apiResponse = await axios.get('http://localhost:54112/api/issues?latitude=40.7589&longitude=-73.9851&radius=5000&limit=20', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ API call successful!');
      console.log('Issues found:', apiResponse.data.data.issues.length);
    } catch (apiError) {
      console.log('❌ API call failed:', apiError.response?.data || apiError.message);
    }

    console.log('\n📋 Login credentials for testing:');
    console.log('Email:', testEmail);
    console.log('Password:', testPassword);

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

testUserAuth().then(() => process.exit(0)).catch(() => process.exit(1));