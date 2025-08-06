const axios = require('axios');

const testCORS = async () => {
  try {
    console.log('🔄 Testing CORS configuration...');
    
    // Test preflight request
    const response = await axios({
      method: 'options',
      url: 'http://localhost:5000/api/auth/register',
      headers: {
        'Origin': 'http://localhost:64971',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });
    
    console.log('✅ CORS preflight successful!');
    console.log('📋 CORS Headers:');
    console.log('   - Access-Control-Allow-Origin:', response.headers['access-control-allow-origin']);
    console.log('   - Access-Control-Allow-Methods:', response.headers['access-control-allow-methods']);
    console.log('   - Access-Control-Allow-Headers:', response.headers['access-control-allow-headers']);
    console.log('   - Access-Control-Allow-Credentials:', response.headers['access-control-allow-credentials']);
    
  } catch (error) {
    console.error('❌ CORS test failed:', error.message);
    if (error.response) {
      console.log('📋 Response headers:', error.response.headers);
    }
  }
};

testCORS();