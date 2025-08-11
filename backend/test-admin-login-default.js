const axios = require('axios');
require('dotenv').config();

const API_BASE_URL = `http://localhost:${process.env.PORT || 54112}/api`;
const ADMIN_CREDENTIALS = {
  email: 'admin@civic.com',
  password: 'admin123'
};

async function testAdminLogin() {
  try {
    console.log('🔄 Testing default admin login...');
    console.log('📧 Email:', ADMIN_CREDENTIALS.email);
    console.log('🔗 URL:', `${API_BASE_URL}/auth/admin/login`);
    console.log('');

    const response = await axios.post(`${API_BASE_URL}/auth/admin/login`, ADMIN_CREDENTIALS);
    
    if (response.data.success) {
      console.log('✅ Admin login successful!');
      console.log('');
      console.log('👤 User Info:');
      console.log('  Name:', response.data.data.user.fullName);
      console.log('  Email:', response.data.data.user.email);
      console.log('  Role:', response.data.data.user.role);
      console.log('  ID:', response.data.data.user._id);
      console.log('');
      console.log('🔑 Tokens received:');
      console.log('  Access Token:', response.data.data.tokens.accessToken ? '✅ Present' : '❌ Missing');
      console.log('  Refresh Token:', response.data.data.tokens.refreshToken ? '✅ Present' : '❌ Missing');
      console.log('');
      console.log('🎯 Login ready for use!');
    } else {
      console.log('❌ Login failed:', response.data.message);
    }

  } catch (error) {
    console.error('❌ Error testing admin login:');
    
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Message:', error.response.data.message || error.response.data);
    } else if (error.code === 'ECONNREFUSED') {
      console.log('⚠️  Backend server is not running!');
      console.log('💡 Start the backend server first:');
      console.log('   cd backend');
      console.log('   npm run dev');
    } else {
      console.log('Error:', error.message);
    }
  }
}

// Check if backend is running
async function checkBackend() {
  try {
    const response = await axios.get(`${API_BASE_URL}/health`);
    return true;
  } catch (error) {
    try {
      // Try a simple request to see if server is responding
      await axios.get(`http://localhost:${process.env.PORT || 54112}`);
      return true;
    } catch (e) {
      return false;
    }
  }
}

async function main() {
  console.log('🚀 Default Admin Login Test');
  console.log('========================');
  console.log('');

  // Check if backend is running
  const backendRunning = await checkBackend();
  if (!backendRunning) {
    console.log('⚠️  Backend server doesn\'t appear to be running');
    console.log('💡 To start the backend server:');
    console.log('   cd backend');
    console.log('   npm run dev');
    console.log('');
    console.log('📝 Default admin credentials to use once server is running:');
    console.log('   Email:', ADMIN_CREDENTIALS.email);
    console.log('   Password:', ADMIN_CREDENTIALS.password);
    return;
  }

  await testAdminLogin();
}

if (require.main === module) {
  main().then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error('Test failed:', error.message);
    process.exit(1);
  });
}

module.exports = { testAdminLogin, ADMIN_CREDENTIALS };