const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');

async function debugUserLogin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const testEmail = 'test@example.com';
    const testPassword = 'Test123!';
    
    // Check if user exists
    const user = await User.findOne({ email: testEmail });
    console.log('User exists:', !!user);
    
    if (user) {
      console.log('User data:', {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        hasPassword: !!user.password
      });
      
      if (user.password) {
        // Test password comparison
        const isValid = await bcryptjs.compare(testPassword, user.password);
        console.log('Password validation result:', isValid);
        
        // Set a new password and test
        console.log('Setting new password...');
        const hashedPassword = await bcryptjs.hash(testPassword, 12);
        user.password = hashedPassword;
        await user.save();
        
        const isValidNew = await bcryptjs.compare(testPassword, user.password);
        console.log('New password validation result:', isValidNew);
      } else {
        console.log('No password set, creating one...');
        const hashedPassword = await bcryptjs.hash(testPassword, 12);
        user.password = hashedPassword;
        await user.save();
        console.log('Password created and saved');
      }
    } else {
      console.log('Creating new test user...');
      const hashedPassword = await bcryptjs.hash(testPassword, 12);
      
      const newUser = new User({
        firstName: 'Test',
        lastName: 'User',
        email: testEmail,
        password: hashedPassword,
        role: 'user',
        isActive: true
      });
      
      await newUser.save();
      console.log('New user created');
    }
    
    // Now test the actual login endpoint
    console.log('\n🧪 Testing login endpoint...');
    const axios = require('axios');
    
    try {
      const response = await axios.post('http://localhost:54112/api/auth/login', {
        email: testEmail,
        password: testPassword
      });
      
      console.log('✅ Login successful!');
      console.log('User role:', response.data.data.user.role);
      console.log('Token length:', response.data.data.tokens.accessToken.length);
      
    } catch (loginError) {
      console.log('❌ Login failed:', loginError.response?.data || loginError.message);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

debugUserLogin();