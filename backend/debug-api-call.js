const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config();

async function testAPICall() {
  try {
    // Create a valid test token
    const testUserId = '68936faebfa5b3bebb3a4e24'; // Real test user ID
    const accessToken = jwt.sign(
      { 
        userId: testUserId,
        role: 'user',
        email: 'test@example.com'
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '24h' }
    );

    console.log('🎟️ Using token:', accessToken.substring(0, 50) + '...');

    // Test the API endpoint
    console.log('🧪 Making API call...');
    
    const response = await axios.get('http://localhost:54112/api/issues', {
      params: {
        latitude: 40.7589,
        longitude: -73.9851,
        radius: 5000,
        limit: 20
      },
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ API call successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.log('❌ API call failed');
    
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Error data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('Error message:', error.message);
    }
  }
}

testAPICall();