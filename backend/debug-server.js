// backend/debug-server.js - Quick debug script to check what's wrong
const mongoose = require('mongoose');
const Property = require('./models/Property');
const Area = require('./models/Area');
require('dotenv').config();

async function debugServer() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if collections exist and have data
    console.log('\n📊 Database Status:');
    
    // Check Properties
    try {
      const propertyCount = await Property.countDocuments({});
      console.log(`   Properties: ${propertyCount} documents`);
      
      if (propertyCount > 0) {
        const sampleProperty = await Property.findOne({});
        console.log(`   Sample property:`, {
          title: sampleProperty.title,
          propertyType: sampleProperty.propertyType,
          areaKey: sampleProperty.areaKey
        });
        
        // Check property types distribution
        const residential = await Property.countDocuments({ propertyType: 'residential' });
        const commercial = await Property.countDocuments({ propertyType: 'commercial' });
        const noType = await Property.countDocuments({ 
          $or: [
            { propertyType: { $exists: false } },
            { propertyType: null },
            { propertyType: '' }
          ]
        });
        
        console.log(`   Property Types: Residential=${residential}, Commercial=${commercial}, Missing=${noType}`);
      }
    } catch (error) {
      console.error('❌ Error checking Properties:', error.message);
    }

    // Check Areas
    try {
      const areaCount = await Area.countDocuments({});
      console.log(`   Areas: ${areaCount} documents`);
      
      if (areaCount > 0) {
        const areas = await Area.find({});
        console.log(`   Area keys:`, areas.map(a => a.key));
      }
    } catch (error) {
      console.error('❌ Error checking Areas:', error.message);
    }

    // Check what routes should be working
    console.log('\n🛣️ Expected API Routes:');
    console.log('   GET /api/health - Server health check');
    console.log('   GET /api/properties - Get all properties');
    console.log('   GET /api/properties?propertyType=residential - Filter by type');
    console.log('   GET /api/properties?area=central-noida - Filter by area');
    console.log('   GET /api/areas - Get all areas');

    // Test basic property query
    console.log('\n🧪 Testing basic queries:');
    try {
      const allProperties = await Property.find({}).limit(5);
      console.log(`   ✅ Can query properties: ${allProperties.length} found`);
      
      const residentialProperties = await Property.find({ propertyType: 'residential' }).limit(3);
      console.log(`   ✅ Can filter by residential: ${residentialProperties.length} found`);
      
      const centralNoidaProperties = await Property.find({ areaKey: 'central-noida' }).limit(3);
      console.log(`   ✅ Can filter by central-noida: ${centralNoidaProperties.length} found`);
      
    } catch (error) {
      console.error('❌ Error in test queries:', error.message);
    }

    console.log('\n🔧 Troubleshooting Tips:');
    console.log('1. Make sure your backend server is running on the correct port');
    console.log('2. Check if CORS is properly configured');
    console.log('3. Ensure routes are properly mounted in server.js');
    console.log('4. Verify environment variables are set correctly');
    console.log('5. Check if middleware is properly configured');

    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);

  } catch (error) {
    console.error('❌ Debug script error:', error);
    process.exit(1);
  }
}

console.log('🔍 Starting server debug check...');
debugServer();