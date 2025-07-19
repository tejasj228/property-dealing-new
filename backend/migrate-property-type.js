// backend/add-property-types.js - Simple migration to fix existing properties
const mongoose = require('mongoose');
const Property = require('./models/Property');
require('dotenv').config();

async function addPropertyTypesToExisting() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all properties without propertyType
    console.log('🔍 Finding properties without propertyType...');
    const properties = await Property.find({
      $or: [
        { propertyType: { $exists: false } },
        { propertyType: null },
        { propertyType: '' }
      ]
    });

    console.log(`📊 Found ${properties.length} properties to update`);

    if (properties.length === 0) {
      console.log('✅ All properties already have propertyType field');
      await mongoose.disconnect();
      process.exit(0);
    }

    // Update all properties to have propertyType = 'residential'
    const result = await Property.updateMany(
      {
        $or: [
          { propertyType: { $exists: false } },
          { propertyType: null },
          { propertyType: '' }
        ]
      },
      { 
        $set: { propertyType: 'residential' }
      }
    );

    console.log(`✅ Updated ${result.modifiedCount} properties with propertyType: 'residential'`);

    // Get final counts
    const totalProperties = await Property.countDocuments({});
    const residentialCount = await Property.countDocuments({ propertyType: 'residential' });
    const commercialCount = await Property.countDocuments({ propertyType: 'commercial' });

    console.log('\n🎉 Migration completed successfully!');
    console.log('📊 Final Summary:');
    console.log(`   Total properties: ${totalProperties}`);
    console.log(`   🏠 Residential: ${residentialCount}`);
    console.log(`   🏢 Commercial: ${commercialCount}`);

    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error during migration:', error);
    process.exit(1);
  }
}

// Run the migration
console.log('🚀 Starting property type migration...');
console.log('This will add propertyType: "residential" to all existing properties without it.');
console.log('');

addPropertyTypesToExisting();