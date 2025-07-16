// backend/migrate-order.js - Run this to add order fields to existing data
const mongoose = require('mongoose');
const Area = require('./models/Area');
const Property = require('./models/Property');
const SliderImage = require('./models/SliderImage');
require('dotenv').config();

async function migrateOrderFields() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // 🆕 Migrate Areas
    console.log('🏢 Adding order fields to areas...');
    const areas = await Area.find({}).sort({ createdAt: 1 });
    for (let i = 0; i < areas.length; i++) {
      const area = areas[i];
      
      // Add order to main area if not exists
      if (area.order === undefined || area.order === null) {
        area.order = i;
        console.log(`  Setting area order: ${area.name} -> ${i}`);
      }
      
      // Add order to sub-areas if not exists
      if (area.subAreas && area.subAreas.length > 0) {
        area.subAreas.forEach((subArea, index) => {
          if (subArea.order === undefined || subArea.order === null) {
            subArea.order = index;
            console.log(`    Setting sub-area order: ${subArea.title} -> ${index}`);
          }
        });
      }
      
      await area.save();
    }
    console.log(`✅ Updated ${areas.length} areas with order fields`);

    // 🆕 Migrate Properties
    console.log('🏠 Adding order fields to properties...');
    
    // Get properties grouped by area for proper ordering
    const areaKeys = ['noida', 'yamuna-expressway'];
    
    for (const areaKey of areaKeys) {
      const properties = await Property.find({ areaKey }).sort({ createdAt: 1 });
      console.log(`  Processing ${properties.length} properties in ${areaKey}`);
      
      for (let i = 0; i < properties.length; i++) {
        const property = properties[i];
        if (property.order === undefined || property.order === null) {
          property.order = i;
          await property.save();
          console.log(`    Setting property order: ${property.title} -> ${i}`);
        }
      }
    }

    // Handle any properties not in specific areas
    const otherProperties = await Property.find({ 
      areaKey: { $nin: areaKeys } 
    }).sort({ createdAt: 1 });
    
    for (let i = 0; i < otherProperties.length; i++) {
      const property = otherProperties[i];
      if (property.order === undefined || property.order === null) {
        property.order = i;
        await property.save();
        console.log(`    Setting other property order: ${property.title} -> ${i}`);
      }
    }

    const totalProperties = await Property.countDocuments({});
    console.log(`✅ Updated ${totalProperties} properties with order fields`);

    // 🆕 Migrate Slider Images
    console.log('🖼️ Adding order fields to slider images...');
    const sliderImages = await SliderImage.find({}).sort({ createdAt: 1 });
    for (let i = 0; i < sliderImages.length; i++) {
      const image = sliderImages[i];
      if (image.order === undefined || image.order === null) {
        image.order = i;
        await image.save();
        console.log(`  Setting slider image order: ${image.title} -> ${i}`);
      }
    }
    console.log(`✅ Updated ${sliderImages.length} slider images with order fields`);

    console.log('\n🎉 Migration completed successfully!');
    console.log('📊 Summary:');
    console.log(`   ✅ Areas: ${areas.length} updated`);
    console.log(`   ✅ Properties: ${totalProperties} updated`);
    console.log(`   ✅ Slider Images: ${sliderImages.length} updated`);
    console.log('\n🔄 All documents now have order fields for drag & drop functionality!');

    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during migration:', error);
    process.exit(1);
  }
}

// Run the migration
console.log('🚀 Starting order fields migration...');
console.log('This will add order fields to existing areas, properties, and slider images.');
console.log('');

migrateOrderFields();