const mongoose = require('mongoose');
require('dotenv').config();

const Issue = require('./models/Issue');

async function checkIndexes() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Check existing indexes
    const issueIndexes = await Issue.collection.getIndexes();
    console.log('📊 Current Issue model indexes:');
    Object.keys(issueIndexes).forEach(indexName => {
      console.log(`  - ${indexName}: ${JSON.stringify(issueIndexes[indexName])}`);
    });
    
    // Check if geospatial index exists
    const hasGeospatialIndex = Object.keys(issueIndexes).some(indexName => 
      indexName.includes('location') || JSON.stringify(issueIndexes[indexName]).includes('2dsphere')
    );
    
    if (hasGeospatialIndex) {
      console.log('✅ Geospatial index found!');
    } else {
      console.log('⚠️  No geospatial index found. Creating it...');
      try {
        await Issue.collection.createIndex({ location: '2dsphere' });
        console.log('✅ Geospatial index created successfully!');
      } catch (error) {
        console.error('❌ Failed to create geospatial index:', error.message);
      }
    }
    
    // Check sample data
    const issueCount = await Issue.countDocuments();
    console.log(`📋 Total issues in database: ${issueCount}`);
    
  } catch (error) {
    console.error('❌ Check failed:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

checkIndexes().then(() => process.exit(0)).catch(() => process.exit(1));