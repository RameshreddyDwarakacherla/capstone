const mongoose = require('mongoose');
require('dotenv').config();

const testConnection = async () => {
  console.log('🔄 Testing MongoDB connection...');
  console.log('📍 Connection string:', process.env.MONGODB_URI);
  
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
    });
    
    console.log('✅ MongoDB connection successful!');
    console.log('📊 Database:', mongoose.connection.db.databaseName);
    console.log('🏠 Host:', mongoose.connection.host);
    
    // Test basic operations
    const testCollection = mongoose.connection.db.collection('test');
    await testCollection.insertOne({ test: 'connection', timestamp: new Date() });
    console.log('✅ Test document inserted successfully');
    
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:');
    console.error('📝 Error:', error.message);
    
    if (error.message.includes('ENOTFOUND')) {
      console.log('\n💡 Suggestions:');
      console.log('1. Check if MongoDB is running locally (if using local connection)');
      console.log('2. Verify your MongoDB Atlas cluster exists and is running');
      console.log('3. Check your internet connection');
      console.log('4. Verify the MONGODB_URI in your .env file');
    }
    
    if (error.message.includes('authentication failed')) {
      console.log('\n💡 Authentication issue:');
      console.log('1. Check your username and password');
      console.log('2. Make sure your IP is whitelisted in MongoDB Atlas');
    }
  }
};

testConnection();