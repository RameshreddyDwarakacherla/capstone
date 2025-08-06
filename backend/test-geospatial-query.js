const mongoose = require('mongoose');
require('dotenv').config();

const Issue = require('./models/Issue');

async function testGeospatialQuery() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Check if issues exist
    const totalIssues = await Issue.countDocuments();
    console.log('📊 Total issues in database:', totalIssues);

    if (totalIssues > 0) {
      // Get a sample issue to see its structure
      const sampleIssue = await Issue.findOne().lean();
      console.log('📋 Sample issue location:', JSON.stringify(sampleIssue.location, null, 2));
    }

    // Test basic find query
    console.log('\n🔍 Testing basic query...');
    const basicIssues = await Issue.find({}).limit(5).lean();
    console.log('Basic query result:', basicIssues.length, 'issues found');

    // Test geospatial query with coordinates
    console.log('\n🌍 Testing geospatial query...');
    const lat = 40.7589;
    const lng = -73.9851;
    const radius = 5000;

    try {
      const geoQuery = {
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [lng, lat]
            },
            $maxDistance: radius
          }
        }
      };

      console.log('Query:', JSON.stringify(geoQuery, null, 2));
      
      const geoIssues = await Issue.find(geoQuery).limit(20).lean();
      console.log('✅ Geospatial query successful!', geoIssues.length, 'issues found');

      geoIssues.forEach((issue, index) => {
        console.log(`Issue ${index + 1}:`, issue.title, 'at', issue.location.coordinates);
      });

    } catch (geoError) {
      console.log('❌ Geospatial query failed:', geoError.message);
      console.log('Full error:', geoError);

      // Check if index exists
      const indexes = await Issue.collection.getIndexes();
      console.log('\n📊 Current indexes:');
      Object.keys(indexes).forEach(indexName => {
        console.log(`  - ${indexName}:`, JSON.stringify(indexes[indexName]));
      });
    }

    // Test the controller logic
    console.log('\n🧪 Testing controller logic...');
    const { validateCoordinates } = require('./utils/geocoding');
    
    if (validateCoordinates(lng, lat)) {
      console.log('✅ Coordinates are valid');
      
      // Simulate the exact query from the controller
      const filter = {
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [lng, lat]
            },
            $maxDistance: radius
          }
        }
      };

      try {
        const controllerResults = await Issue.find(filter)
          .populate('reportedBy', 'firstName lastName email')
          .sort({ createdAt: -1 })
          .limit(20)
          .lean();

        console.log('✅ Controller simulation successful!', controllerResults.length, 'issues found');
      } catch (controllerError) {
        console.log('❌ Controller simulation failed:', controllerError.message);
      }
    } else {
      console.log('❌ Coordinates are invalid');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

testGeospatialQuery().then(() => process.exit(0)).catch(() => process.exit(1));