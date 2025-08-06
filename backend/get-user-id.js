const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');

async function getUserId() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const testUser = await User.findOne({ email: 'test@example.com' });
    if (testUser) {
      console.log('Test user ID:', testUser._id.toString());
    } else {
      console.log('Test user not found');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

getUserId();