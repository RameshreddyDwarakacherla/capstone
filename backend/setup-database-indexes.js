const mongoose = require('mongoose');
require('dotenv').config();

const Issue = require('./models/Issue');
const User = require('./models/User');

async function setupDatabaseIndexes() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    console.log('📝 Creating database indexes...');
    
    // Force index creation for Issue model
    console.log('  - Creating Issue indexes...');
    await Issue.createIndexes();
    
    // Force index creation for User model  
    console.log('  - Creating User indexes...');
    await User.createIndexes();
    
    // Verify geospatial index exists
    const issueIndexes = await Issue.collection.getIndexes();
    console.log('📊 Issue model indexes:');
    Object.keys(issueIndexes).forEach(indexName => {
      console.log(`  - ${indexName}: ${JSON.stringify(issueIndexes[indexName])}`);
    });
    
    const userIndexes = await User.collection.getIndexes();
    console.log('📊 User model indexes:');
    Object.keys(userIndexes).forEach(indexName => {
      console.log(`  - ${indexName}: ${JSON.stringify(userIndexes[indexName])}`);
    });

    console.log('✅ All database indexes created successfully!');
    
    // Check if there are any issues in the database
    const issueCount = await Issue.countDocuments();
    console.log(`📋 Total issues in database: ${issueCount}`);
    
    if (issueCount === 0) {
      console.log('💡 No issues found. Creating sample data...');
      
      // Find a user to associate with sample issues
      const sampleUser = await User.findOne();
      if (sampleUser) {
        const sampleIssues = [
          {
            title: 'Pothole on Main Street',
            description: 'Large pothole causing damage to vehicles',
            category: 'pothole',
            priority: 'high',
            location: {
              type: 'Point',
              coordinates: [-73.9851, 40.7589] // NYC coordinates
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
            isPublic: true
          },
          {
            title: 'Broken Street Light',
            description: 'Street light has been out for 2 weeks',
            category: 'street_light',
            priority: 'medium',
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
            isPublic: true
          },
          {
            title: 'Graffiti on Building Wall',
            description: 'Offensive graffiti needs to be cleaned',
            category: 'graffiti',
            priority: 'low',
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
            isPublic: true
          }
        ];
        
        for (const issueData of sampleIssues) {
          const issue = new Issue(issueData);
          await issue.save();
          console.log(`  ✅ Created sample issue: ${issue.title}`);
        }
        
        console.log('✅ Sample issues created successfully!');
      } else {
        console.log('⚠️  No users found. Please register a user first.');
      }
    }

  } catch (error) {
    console.error('❌ Database setup failed:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run if called directly
if (require.main === module) {
  setupDatabaseIndexes()
    .then(() => {
      console.log('🎉 Database setup completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Database setup failed:', error);
      process.exit(1);
    });
}

module.exports = setupDatabaseIndexes;