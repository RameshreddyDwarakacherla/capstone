const axios = require('axios');
const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');

async function testCompleteAPI() {
  try {
    // Connect to create/verify test user
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Ensure test user exists with correct password
    const testEmail = 'test@example.com';
    const testPassword = 'Test123!';
    
    let testUser = await User.findOne({ email: testEmail });
    
    if (testUser) {
      // Update password to ensure it's correct
      const hashedPassword = await bcryptjs.hash(testPassword, 12);
      testUser.password = hashedPassword;
      await testUser.save();
      console.log('✅ Test user password updated');
    }
    
    await mongoose.connection.close();

    // Now test the API
    console.log('🔐 Logging in with test user...');
    const loginResponse = await axios.post('http://localhost:54112/api/auth/login', {
      email: testEmail,
      password: testPassword
    });

    console.log('✅ Login successful!');
    const { tokens } = loginResponse.data.data;

    // Test the issues endpoint
    console.log('🧪 Testing issues geospatial endpoint...');
    const issuesResponse = await axios.get('http://localhost:54112/api/issues', {
      params: {
        latitude: 40.7589,
        longitude: -73.9851,
        radius: 5000,
        limit: 20
      },
      headers: {
        'Authorization': `Bearer ${tokens.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Issues API successful!');
    console.log('Response status:', issuesResponse.status);
    console.log('Issues found:', issuesResponse.data.data.issues.length);
    console.log('Total count:', issuesResponse.data.data.pagination.totalCount);
    
    // Show first issue details
    if (issuesResponse.data.data.issues.length > 0) {
      const firstIssue = issuesResponse.data.data.issues[0];
      console.log('First issue:', {
        title: firstIssue.title,
        category: firstIssue.category,
        reportedBy: firstIssue.reportedBy?.firstName,
        location: firstIssue.location.coordinates
      });
    }

  } catch (error) {
    console.log('❌ Error:', error.response?.data || error.message);
    if (error.response?.data?.stack) {
      console.log('Stack trace:', error.response.data.stack);
    }
  }
}

testCompleteAPI();