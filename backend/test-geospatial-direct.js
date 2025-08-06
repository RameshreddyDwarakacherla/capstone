const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Issue = require('./models/Issue');
const User = require('./models/User');

async function testDirectGeospatialQuery() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Test the exact query from the controller
    const latitude = 40.7589;
    const longitude = -73.9851;
    const radius = 5000;

    console.log('🧪 Testing exact controller query...');
    
    // Build filter object (same as controller)
    const filter = {
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude] // [lng, lat]
          },
          $maxDistance: radius
        }
      }
    };

    console.log('Query filter:', JSON.stringify(filter, null, 2));

    try {
      // Execute the exact same query as controller
      const [issues, totalCount] = await Promise.all([
        Issue.find(filter)
          .populate('reportedBy', 'firstName lastName email')
          .populate('assignedTo', 'firstName lastName email')
          .sort({ createdAt: -1 })
          .limit(20)
          .lean(),
        Issue.countDocuments(filter)
      ]);

      console.log('✅ Query successful!');
      console.log('Issues found:', issues.length);
      console.log('Total count:', totalCount);

      issues.forEach((issue, idx) => {
        console.log(`${idx + 1}. ${issue.title} by ${issue.reportedBy?.firstName || 'Unknown'}`);
      });

    } catch (queryError) {
      console.log('❌ Query failed:', queryError.message);
      console.log('Error details:', queryError);

      // Test without populate to see if that's the issue
      console.log('\n🔍 Testing without populate...');
      try {
        const simpleIssues = await Issue.find(filter).limit(20).lean();
        console.log('✅ Simple query (no populate) successful!', simpleIssues.length, 'issues');
        
        // Test just populate reportedBy
        console.log('\n🔍 Testing with reportedBy populate only...');
        const reportedByIssues = await Issue.find(filter)
          .populate('reportedBy', 'firstName lastName email')
          .limit(20)
          .lean();
        console.log('✅ ReportedBy populate successful!', reportedByIssues.length, 'issues');

      } catch (simpleError) {
        console.log('❌ Even simple query failed:', simpleError.message);
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

testDirectGeospatialQuery().then(() => process.exit(0)).catch(() => process.exit(1));