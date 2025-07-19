// backend/migrate-property-type.js - Run this to add propertyType field to existing properties
const mongoose = require('mongoose');
const Property = require('./models/Property');
require('dotenv').config();

async function migratePropertyType() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // 🆕 Migrate Properties - Add propertyType field
    console.log('🏠 Adding propertyType field to existing properties...');
    
    const properties = await Property.find({});
    console.log(`📊 Found ${properties.length} properties to update`);

    let updatedCount = 0;
    let alreadyHadType = 0;

    for (const property of properties) {
      // Check if property already has propertyType field
      if (property.propertyType) {
        console.log(`  ✅ Property "${property.title}" already has type: ${property.propertyType}`);
        alreadyHadType++;
        continue;
      }

      // Add default propertyType based on title or set to 'residential'
      let propertyType = 'residential'; // Default to residential

      // Smart detection based on title/description keywords
      const titleLower = property.title.toLowerCase();
      const descriptionLower = (property.description || '').toLowerCase();
      const features = (property.features || []).join(' ').toLowerCase();
      
      const commercialKeywords = [
        'office', 'shop', 'commercial', 'retail', 'plaza', 'mall', 
        'business', 'workspace', 'coworking', 'showroom', 'warehouse',
        'it park', 'tech park', 'corporate', 'enterprise'
      ];
      
      const hasCommercialKeyword = commercialKeywords.some(keyword => 
        titleLower.includes(keyword) || 
        descriptionLower.includes(keyword) || 
        features.includes(keyword)
      );

      if (hasCommercialKeyword) {
        propertyType = 'commercial';
      }

      // Update the property
      property.propertyType = propertyType;
      await property.save();

      console.log(`  🔄 Updated "${property.title}" -> ${propertyType}`);
      updatedCount++;
    }

    console.log('\n🎉 Property type migration completed successfully!');
    console.log('📊 Migration Summary:');
    console.log(`   ✅ Total properties: ${properties.length}`);
    console.log(`   🆕 Updated with propertyType: ${updatedCount}`);
    console.log(`   ⚡ Already had propertyType: ${alreadyHadType}`);
    console.log(`   🏠 Residential properties: ${await Property.countDocuments({ propertyType: 'residential' })}`);
    console.log(`   🏢 Commercial properties: ${await Property.countDocuments({ propertyType: 'commercial' })}`);
    
    console.log('\n🔄 All existing properties now have propertyType field!');
    console.log('💡 Note: Properties were automatically categorized based on keywords in title/description');
    console.log('📝 Please review and manually adjust property types in the admin panel if needed');

    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during property type migration:', error);
    process.exit(1);
  }
}

// Run the migration
console.log('🚀 Starting property type migration...');
console.log('This will add propertyType field to existing properties.');
console.log('Properties will be automatically categorized as residential or commercial based on keywords.');
console.log('');

migratePropertyType();