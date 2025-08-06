const axios = require('axios');

// Test with an authenticated user session (using the login endpoint first)
async function testAPI() {
  try {
    // First login to get a valid token
    console.log('🔐 Logging in...');
    const loginResponse = await axios.post('http://localhost:54112/api/auth/login', {
      email: 'test@example.com',
      password: 'Test123!'
    });

    const { tokens } = loginResponse.data.data;
    console.log('✅ Login successful!');

    // Now test the issues endpoint
    console.log('🧪 Testing issues endpoint...');
    const issuesResponse = await axios.get('http://localhost:54112/api/issues', {
      params: {
        latitude: 40.7589,
        longitude: -73.9851,
        radius: 5000,
        limit: 20
      },
      headers: {
        'Authorization': `Bearer ${tokens.accessToken}`
      }
    });

    console.log('✅ Issues API successful!');
    console.log('Found', issuesResponse.data.data.issues.length, 'issues');

  } catch (error) {
    console.log('❌ Error:', error.response?.data || error.message);
  }
}

testAPI();