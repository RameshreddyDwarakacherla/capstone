const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');

async function debugAuthFlow() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const testEmail = 'test@example.com';
    const testPassword = 'Test123!';
    
    console.log('🔍 Testing exact auth controller flow...');
    
    // Step 1: Find user with password field (exactly as in auth controller)
    const user = await User.findByEmail(testEmail).select('+password');
    console.log('Step 1 - User found:', !!user);
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('User details:', {
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      isLocked: user.isLocked,
      hasPassword: !!user.password,
      passwordLength: user.password?.length || 0
    });
    
    // Step 2: Check if account is locked
    if (user.isLocked) {
      console.log('❌ Account is locked');
      return;
    }
    
    // Step 3: Check if account is active  
    if (!user.isActive) {
      console.log('❌ Account is not active');
      return;
    }
    
    // Step 4: Verify password (exactly as in auth controller)
    console.log('Step 4 - Comparing password...');
    const isPasswordValid = await user.comparePassword(testPassword);
    console.log('Password validation result:', isPasswordValid);
    
    if (!isPasswordValid) {
      console.log('❌ Password validation failed');
      
      // Let's manually test bcrypt comparison
      const bcrypt = require('bcryptjs');
      const manualCompare = await bcrypt.compare(testPassword, user.password);
      console.log('Manual bcrypt comparison:', manualCompare);
      
      // Let's check the password hash
      console.log('Stored password hash:', user.password);
      
      // Let's create a new hash and test
      const newHash = await bcrypt.hash(testPassword, 12);
      const newCompare = await bcrypt.compare(testPassword, newHash);
      console.log('New hash comparison:', newCompare);
      
      return;
    }
    
    console.log('✅ All auth steps passed successfully!');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

debugAuthFlow();