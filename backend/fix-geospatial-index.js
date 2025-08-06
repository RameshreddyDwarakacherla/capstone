const mongoose = require('mongoose');
require('dotenv').config();

async function fixGeospatialIndex() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const issuesCollection = db.collection('issues');
    
    // Check existing indexes
    console.log('📋 Checking existing indexes...');
    const existingIndexes = await issuesCollection.listIndexes().toArray();
    console.log('Current indexes:', existingIndexes.map(idx => idx.name));
    
    // Check if 2dsphere index exists
    const hasGeospatialIndex = existingIndexes.some(index => 
      index.name.includes('location') || 
      (index.key && index.key.location === '2dsphere')
    );
    
    if (!hasGeospatialIndex) {
      console.log('🔧 Creating 2dsphere index for location field...');
      await issuesCollection.createIndex({ "location": "2dsphere" });
      console.log('✅ Geospatial index created');
    } else {
      console.log('✅ Geospatial index already exists');
    }
    
    // Check issue count
    const issueCount = await issuesCollection.countDocuments();
    console.log(`📊 Issues in database: ${issueCount}`);
    
    if (issueCount === 0) {
      console.log('🔧 Creating sample issues...');
      
      // Find a user for sample data
      const usersCollection = db.collection('users');
      const sampleUser = await usersCollection.findOne();
      
      if (sampleUser) {
        const sampleIssues = [
          {
            title: 'Pothole on Main Street',
            description: 'Large pothole causing damage to vehicles near the intersection',
            category: 'pothole',
            priority: 'high',
            status: 'pending',
            location: {
              type: 'Point',
              coordinates: [-73.9851, 40.7589] // NYC coordinates [longitude, latitude]
            },
            address: {
              street: '123 Main Street',
              city: 'New York',
              state: 'NY',
              zipCode: '10001',
              country: 'USA',
              formatted: '123 Main Street, New York, NY 10001'
            },
            reportedBy: sampleUser._id,
            isPublic: true,
            votes: { upvotes: [], downvotes: [] },
            statusHistory: [{
              status: 'pending',
              changedBy: sampleUser._id,
              changedAt: new Date(),
              reason: 'Initial report'
            }],
            adminNotes: [],
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            title: 'Broken Street Light',
            description: 'Street light has been out for 2 weeks making the area unsafe at night',
            category: 'street_light',
            priority: 'medium',
            status: 'pending',
            location: {
              type: 'Point',
              coordinates: [-73.9801, 40.7505]
            },
            address: {
              street: '456 Broadway',
              city: 'New York',
              state: 'NY',
              zipCode: '10013',
              country: 'USA',
              formatted: '456 Broadway, New York, NY 10013'
            },
            reportedBy: sampleUser._id,
            isPublic: true,
            votes: { upvotes: [], downvotes: [] },
            statusHistory: [{
              status: 'pending',
              changedBy: sampleUser._id,
              changedAt: new Date(),
              reason: 'Initial report'
            }],
            adminNotes: [],
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            title: 'Drainage Problem',
            description: 'Water accumulates after rain causing flooding',
            category: 'drainage',
            priority: 'medium',
            status: 'pending',
            location: {
              type: 'Point',
              coordinates: [-73.9857, 40.7484]
            },
            address: {
              street: '789 Park Avenue',
              city: 'New York',
              state: 'NY',
              zipCode: '10075',
              country: 'USA',
              formatted: '789 Park Avenue, New York, NY 10075'
            },
            reportedBy: sampleUser._id,
            isPublic: true,
            votes: { upvotes: [], downvotes: [] },
            statusHistory: [{
              status: 'pending',
              changedBy: sampleUser._id,
              changedAt: new Date(),
              reason: 'Initial report'
            }],
            adminNotes: [],
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ];
        
        await issuesCollection.insertMany(sampleIssues);
        console.log(`✅ Created ${sampleIssues.length} sample issues`);
      } else {
        console.log('⚠️  No users found for sample data');
      }
    }
    
    // Verify the geospatial query works
    console.log('🧪 Testing geospatial query...');
    const testQuery = {
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [-73.9851, 40.7589]
          },
          $maxDistance: 5000
        }
      }
    };
    
    const nearbyIssues = await issuesCollection.find(testQuery).limit(1).toArray();
    console.log(`✅ Geospatial query test successful. Found ${nearbyIssues.length} nearby issues`);
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Connection closed');
  }
}

if (require.main === module) {
  fixGeospatialIndex()
    .then(() => {
      console.log('🎉 Geospatial index setup completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Setup failed:', error);
      process.exit(1);
    });
}

module.exports = fixGeospatialIndex;