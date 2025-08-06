const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

// Test admin login functionality
const testAdminLogin = async () => {
  console.log('🧪 Testing Admin Login Functionality...\n');

  try {
    // Test 1: Admin login with admin credentials should work
    console.log('📝 Test 1: Admin login with admin credentials');
    try {
      const adminLoginResponse = await axios.post(`${API_BASE}/auth/admin/login`, {
        email: 'admin@example.com', // Replace with your admin email
        password: 'Admin123!@#'      // Replace with your admin password
      });
      
      if (adminLoginResponse.data.success) {
        console.log('✅ Admin login successful');
        console.log('👤 User role:', adminLoginResponse.data.data.user.role);
        console.log('🎯 Access token received:', !!adminLoginResponse.data.data.tokens.accessToken);
      }
    } catch (error) {
      console.log('❌ Admin login failed:', error.response?.data?.message || error.message);
    }

    console.log('\n---\n');

    // Test 2: Admin login with user credentials should fail
    console.log('📝 Test 2: Admin login with user credentials (should fail)');
    try {
      const userAsAdminResponse = await axios.post(`${API_BASE}/auth/admin/login`, {
        email: 'user@example.com',  // Replace with a regular user email
        password: 'User123!@#'      // Replace with user password
      });
      
      console.log('❌ This should not succeed - user logged in as admin!');
    } catch (error) {
      if (error.response?.data?.message?.includes('Admin credentials required')) {
        console.log('✅ Correctly rejected user trying to login as admin');
        console.log('📄 Error message:', error.response.data.message);
      } else {
        console.log('⚠️  Failed for different reason:', error.response?.data?.message || error.message);
      }
    }

    console.log('\n---\n');

    // Test 3: Regular user login should work normally
    console.log('📝 Test 3: Regular user login');
    try {
      const userLoginResponse = await axios.post(`${API_BASE}/auth/login`, {
        email: 'user@example.com',  // Replace with a regular user email
        password: 'User123!@#'      // Replace with user password
      });
      
      if (userLoginResponse.data.success) {
        console.log('✅ User login successful');
        console.log('👤 User role:', userLoginResponse.data.data.user.role);
      }
    } catch (error) {
      console.log('❌ User login failed:', error.response?.data?.message || error.message);
    }

  } catch (error) {
    console.error('🔥 Test setup error:', error.message);
  }

  console.log('\n🏁 Admin login tests completed!');
  console.log('\n💡 Instructions:');
  console.log('1. Make sure your backend server is running on localhost:5000');
  console.log('2. Update the email/password combinations in this test file');
  console.log('3. Create an admin user if one doesn\'t exist:');
  console.log('   - Use POST /auth/admin/register endpoint');
  console.log('   - Or manually set role="admin" in your database');
};

// Run the test
testAdminLogin();