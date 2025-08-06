const mongoose = require('mongoose');
require('dotenv').config();

const Issue = require('./models/Issue');
const User = require('./models/User');

async function testFixedGeospatialQuery() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Test the NEW geospatial query (using $geoWithin)
    const latitude = 40.7589;
    const longitude = -73.9851;
    const radius = 5000;

    console.log('🧪 Testing NEW geospatial query with $geoWithin...');
    
    const geoFilter = {
      location: {
        $geoWithin: {
          $centerSphere: [[longitude, latitude], radius / 6378137] // radius in radians
        }
      }
    };

    console.log('Query filter:', JSON.stringify(geoFilter, null, 2));

    try {
      const [issues, totalCount] = await Promise.all([
        Issue.find(geoFilter)
          .populate('reportedBy', 'firstName lastName email')
          .populate('assignedTo', 'firstName lastName email')
          .sort({ createdAt: -1 })
          .limit(20)
          .lean(),
        Issue.countDocuments(geoFilter)
      ]);

      console.log('✅ NEW geospatial query successful!');
      console.log('Issues found:', issues.length);
      console.log('Total count:', totalCount);

      issues.forEach((issue, idx) => {
        console.log(`${idx + 1}. ${issue.title} by ${issue.reportedBy?.firstName || 'Unknown'} - ${issue.createdAt}`);
      });

    } catch (queryError) {
      console.log('❌ NEW query failed:', queryError.message);
      console.log('Error details:', queryError);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

testFixedGeospatialQuery().then(() => process.exit(0)).catch(() => process.exit(1));