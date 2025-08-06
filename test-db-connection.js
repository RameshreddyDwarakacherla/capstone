require('./backend/node_modules/dotenv').config({ path: './backend/.env' });
const mongoose = require('./backend/node_modules/mongoose');

async function testDatabaseConnection() {
  try {
    console.log('Testing MongoDB connection...');
    console.log('MongoDB URI:', process.env.MONGODB_URI ? 'SET' : 'NOT SET');
    
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ MongoDB Connected Successfully:', conn.connection.host);
    console.log('Database Name:', conn.connection.name);
    console.log('Connection State:', conn.connection.readyState);
    
    // Test if we can perform a simple operation
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));
    
    await mongoose.disconnect();
    console.log('Connection closed.');
    
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    
    if (error.name === 'MongoServerError' && error.code === 8000) {
      console.error('Authentication failed - check username/password');
    } else if (error.name === 'MongoNetworkError') {
      console.error('Network error - check connection string and network');
    }
  }
}

testDatabaseConnection();