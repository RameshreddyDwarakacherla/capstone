const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');

async function fixTestUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const testEmail = 'test@example.com';
    const testPassword = 'Test123!';
    
    console.log('🔧 Fixing test user...');
    
    // Delete existing test user
    await User.deleteOne({ email: testEmail });
    console.log('✅ Deleted existing test user');
    
    // Create new test user properly
    const newUser = new User({
      firstName: 'Test',
      lastName: 'User',
      email: testEmail,
      password: testPassword, // Let the pre-save hook hash it
      role: 'user',
      isActive: true
    });
    
    await newUser.save(); // This will trigger the pre-save hook to hash the password
    console.log('✅ Created new test user');
    
    // Test the new user
    const user = await User.findByEmail(testEmail).select('+password');
    const isValid = await user.comparePassword(testPassword);
    console.log('✅ Password validation test:', isValid);
    
    if (isValid) {
      console.log('🎉 Test user is ready for API testing!');
      
      // Test the actual login endpoint
      console.log('\n🧪 Testing login endpoint...');
      const axios = require('axios');
      
      try {
        const response = await axios.post('http://localhost:54112/api/auth/login', {
          email: testEmail,
          password: testPassword
        });
        
        console.log('✅ Login successful!');
        console.log('User:', response.data.data.user.firstName, response.data.data.user.lastName);
        console.log('Role:', response.data.data.user.role);
        
        // Now test the issues endpoint
        console.log('\n🧪 Testing issues endpoint...');
        const issuesResponse = await axios.get('http://localhost:54112/api/issues', {
          params: {
            latitude: 40.7589,
            longitude: -73.9851,
            radius: 5000,
            limit: 20
          },
          headers: {
            'Authorization': `Bearer ${response.data.data.tokens.accessToken}`
          }
        });
        
        console.log('✅ Issues endpoint successful!');
        console.log('Issues found:', issuesResponse.data.data.issues.length);
        console.log('Total count:', issuesResponse.data.data.pagination.totalCount);
        
        console.log('\n🎉 All tests passed! The application is working correctly.');
        
      } catch (apiError) {
        console.log('❌ API test failed:', apiError.response?.data || apiError.message);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

fixTestUser();