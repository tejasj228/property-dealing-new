// backend/seed.js - Updated with Property Types
const mongoose = require('mongoose');
const Area = require('./models/Area');
const Property = require('./models/Property');
const SliderImage = require('./models/SliderImage');
require('dotenv').config();

// Your existing area data
const areas = {
  'central-noida': {
    key: 'central-noida',
    name: 'Central Noida',
    description: 'Prime commercial and residential properties in the heart of Noida with excellent connectivity, modern amenities, and established infrastructure making it a preferred destination for businesses and residents.',
    order: 0,
    subAreas: [
      {
        id: 1,
        title: 'Sector 62 Residential',
        description: 'Modern apartments and independent houses with excellent connectivity to metro and major commercial hubs.',
        order: 0
      },
      {
        id: 2,
        title: 'Sector 63 IT Hub',
        description: 'Premium office spaces and commercial complexes in the heart of Noida\'s IT corridor.',
        order: 1
      },
      {
        id: 3,
        title: 'Sector 50 Premium Villas',
        description: 'Luxury independent villas and builder floors in one of Noida\'s most prestigious sectors.',
        order: 2
      },
      {
        id: 4,
        title: 'Sector 61 Commercial',
        description: 'Strategic commercial properties with high footfall and excellent investment potential.',
        order: 3
      },
      {
        id: 5,
        title: 'Sector 58 Mixed Development',
        description: 'Integrated township with residential, commercial, and retail spaces offering complete lifestyle solutions.',
        order: 4
      },
      {
        id: 6,
        title: 'Sector 59 High-Rise Apartments',
        description: 'Modern high-rise residential complexes with world-class amenities and security features.',
        order: 5
      }
    ]
  },
  'noida-expressway': {
    key: 'noida-expressway',
    name: 'Noida Greater Noida Expressway',
    description: 'Strategic locations along the expressway offering excellent investment opportunities, modern infrastructure, and seamless connectivity to Delhi, Gurgaon, and other major business hubs.',
    order: 1,
    subAreas: [
      {
        id: 1,
        title: 'Sector 137 New Developments',
        description: 'Contemporary residential projects with modern amenities and excellent connectivity to the expressway.',
        order: 0
      },
      {
        id: 2,
        title: 'Sector 143 IT Corridor',
        description: 'Prime commercial spaces along the IT corridor with major multinational companies as neighbors.',
        order: 1
      },
      {
        id: 3,
        title: 'Sector 150 Luxury Residences',
        description: 'Premium residential complexes with world-class facilities and direct expressway connectivity.',
        order: 2
      },
      {
        id: 4,
        title: 'Sector 144 Mixed Use',
        description: 'Integrated development combining residential, commercial, and retail spaces for modern living.',
        order: 3
      },
      {
        id: 5,
        title: 'Sector 168 Investment Hub',
        description: 'Emerging sector with high appreciation potential and excellent infrastructure development.',
        order: 4
      },
      {
        id: 6,
        title: 'Sector 142 Commercial Plaza',
        description: 'Modern commercial complexes with retail outlets, offices, and entertainment facilities.',
        order: 5
      }
    ]
  },
  'yamuna-expressway': {
    key: 'yamuna-expressway',
    name: 'Yamuna Expressway',
    description: 'Emerging real estate destination with world-class infrastructure, excellent connectivity to Delhi and Agra, and upcoming Jewar Airport making it a hotspot for future growth and investment.',
    order: 2,
    subAreas: [
      {
        id: 1,
        title: 'Sector 22D Residential',
        description: 'Affordable housing projects with modern amenities and excellent connectivity to the expressway.',
        order: 0
      },
      {
        id: 2,
        title: 'Sector 25 Luxury Villas',
        description: 'Premium villa projects with large plot sizes and world-class amenities in a serene environment.',
        order: 1
      },
      {
        id: 3,
        title: 'Sector 29 Investment Zone',
        description: 'High-growth potential area with upcoming infrastructure development and airport connectivity.',
        order: 2
      },
      {
        id: 4,
        title: 'Sector 32 Commercial Hub',
        description: 'Emerging commercial center with retail complexes, office spaces, and entertainment facilities.',
        order: 3
      },
      {
        id: 5,
        title: 'Sector 35 Airport Vicinity',
        description: 'Strategic location near the upcoming Jewar Airport with excellent appreciation potential.',
        order: 4
      },
      {
        id: 6,
        title: 'Sector 18 Integrated Township',
        description: 'Complete township development with residential, commercial, and recreational facilities.',
        order: 5
      }
    ]
  }
};

// 🆕 UPDATED: Properties with Property Types
const properties = [
  // Residential Properties
  {
    price: '₹85 Lakhs',
    title: 'Modern 3BHK Apartment',
    location: 'Sector 62, Central Noida',
    beds: 3,
    baths: 2,
    area: '1250 sq ft',
    areaKey: 'central-noida',
    propertyType: 'residential', // 🆕 NEW
    description: 'Beautiful modern apartment with all amenities, perfect for families',
    features: ['Parking', 'Security', 'Gym', 'Garden', 'Children\'s Play Area'],
    links: {
      acres99: 'https://99acres.com/sample-property-1',
      magicbricks: 'https://magicbricks.com/sample-property-1'
    },
    order: 0
  },
  {
    price: '₹1.2 Crores',
    title: 'Luxury 4BHK Villa',
    location: 'Sector 50, Central Noida',
    beds: 4,
    baths: 3,
    area: '2000 sq ft',
    areaKey: 'central-noida',
    propertyType: 'residential', // 🆕 NEW
    description: 'Spacious luxury villa with premium finishes and private garden',
    features: ['Swimming Pool', 'Garden', 'Parking', 'Security', 'Modular Kitchen'],
    links: {
      acres99: 'https://99acres.com/sample-property-2',
      magicbricks: 'https://magicbricks.com/sample-property-2'
    },
    order: 1
  },
  {
    price: '₹95 Lakhs',
    title: 'Contemporary 3BHK Flat',
    location: 'Sector 137, Noida Expressway',
    beds: 3,
    baths: 2,
    area: '1400 sq ft',
    areaKey: 'noida-expressway',
    propertyType: 'residential', // 🆕 NEW
    description: 'Modern flat with expressway connectivity and metro access',
    features: ['Metro Connectivity', 'Shopping Mall', 'Parking', 'Security', 'Club House'],
    links: {
      acres99: 'https://99acres.com/sample-property-3',
      magicbricks: 'https://magicbricks.com/sample-property-3'
    },
    order: 0
  },
  {
    price: '₹65 Lakhs',
    title: 'Spacious 2BHK Apartment',
    location: 'Sector 22D, Yamuna Expressway',
    beds: 2,
    baths: 2,
    area: '1100 sq ft',
    areaKey: 'yamuna-expressway',
    propertyType: 'residential', // 🆕 NEW
    description: 'Affordable apartment with good connectivity and modern amenities',
    features: ['Airport Connectivity', 'Green Spaces', 'Parking', 'Security', 'Power Backup'],
    links: {
      acres99: 'https://99acres.com/sample-property-4',
      magicbricks: 'https://magicbricks.com/sample-property-4'
    },
    order: 0
  },
  
  // 🆕 NEW: Commercial Properties
  {
    price: '₹45 Lakhs',
    title: 'Prime Office Space',
    location: 'Sector 63, Central Noida IT Hub',
    beds: 0, // Not applicable for commercial
    baths: 2,
    area: '800 sq ft',
    areaKey: 'central-noida',
    propertyType: 'commercial', // 🆕 NEW
    description: 'Premium office space in the heart of Noida\'s IT corridor, perfect for startups and small businesses',
    features: ['AC', 'Parking', 'Security', 'High Speed Internet', 'Conference Room', 'Cafeteria'],
    links: {
      acres99: 'https://99acres.com/sample-commercial-1',
      magicbricks: 'https://magicbricks.com/sample-commercial-1'
    },
    order: 2
  },
  {
    price: '₹1.8 Crores',
    title: 'Commercial Plaza Shop',
    location: 'Sector 142, Noida Expressway',
    beds: 0, // Not applicable for commercial
    baths: 1,
    area: '600 sq ft',
    areaKey: 'noida-expressway',
    propertyType: 'commercial', // 🆕 NEW
    description: 'Ground floor shop in premium commercial plaza with high footfall',
    features: ['Ground Floor', 'Parking', 'Security', 'Elevator', 'Prime Location', 'High Visibility'],
    links: {
      acres99: 'https://99acres.com/sample-commercial-2',
      magicbricks: 'https://magicbricks.com/sample-commercial-2'
    },
    order: 1
  },
  {
    price: '₹75 Lakhs',
    title: 'Retail Showroom Space',
    location: 'Sector 32, Yamuna Expressway',
    beds: 0, // Not applicable for commercial
    baths: 2,
    area: '1200 sq ft',
    areaKey: 'yamuna-expressway',
    propertyType: 'commercial', // 🆕 NEW
    description: 'Spacious retail showroom in upcoming commercial hub near Jewar Airport',
    features: ['Wide Frontage', 'Parking', 'Security', 'Loading Area', 'Display Windows', 'Future Growth Area'],
    links: {
      acres99: 'https://99acres.com/sample-commercial-3',
      magicbricks: 'https://magicbricks.com/sample-commercial-3'
    },
    order: 1
  },
  {
    price: '₹2.5 Crores',
    title: 'Corporate Office Floor',
    location: 'Sector 61, Central Noida',
    beds: 0, // Not applicable for commercial
    baths: 3,
    area: '3000 sq ft',
    areaKey: 'central-noida',
    propertyType: 'commercial', // 🆕 NEW
    description: 'Entire floor in premium corporate building, ideal for established businesses',
    features: ['Full Floor', 'AC', 'Parking', 'Security', 'Conference Rooms', 'Pantry', 'Server Room'],
    links: {
      acres99: 'https://99acres.com/sample-commercial-4',
      magicbricks: 'https://magicbricks.com/sample-commercial-4'
    },
    order: 3
  }
];

const sliderImages = [
  {
    title: 'Modern House',
    imageUrl: 'https://images.unsplash.com/photo-1592394675778-4239b838fb2c?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    altText: 'Modern House',
    order: 0
  },
  {
    title: 'Luxury Villa',
    imageUrl: 'https://images.unsplash.com/photo-1673447620374-05f8b4842b41?q=80&w=1228&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    altText: 'Luxury Villa',
    order: 1
  },
  {
    title: 'Commercial Complex',
    imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    altText: 'Commercial Complex',
    order: 2
  },
  {
    title: 'Apartment Complex',
    imageUrl: 'https://i.pinimg.com/736x/3f/14/2a/3f142a2a37a24f0dee2dbafb0eb0964a.jpg',
    altText: 'Apartment Complex 2',
    order: 3
  }
];

async function seedDatabase() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    console.log('🗑️ Clearing existing data...');
    await Area.deleteMany({});
    await Property.deleteMany({});
    await SliderImage.deleteMany({});

    // Seed Areas with order
    console.log('🏢 Seeding areas with order...');
    for (const areaData of Object.values(areas)) {
      const area = new Area(areaData);
      await area.save();
      console.log(`  ✅ Added area: ${areaData.name} (order: ${areaData.order})`);
    }

    // 🆕 UPDATED: Seed Properties with Property Types
    console.log('🏠 Seeding properties with property types...');
    let residentialCount = 0;
    let commercialCount = 0;
    
    for (const propertyData of properties) {
      const property = new Property(propertyData);
      await property.save();
      
      if (propertyData.propertyType === 'residential') {
        residentialCount++;
      } else if (propertyData.propertyType === 'commercial') {
        commercialCount++;
      }
      
      console.log(`  ✅ Added ${propertyData.propertyType} property: ${propertyData.title} (order: ${propertyData.order})`);
    }

    // Seed Slider Images with order
    console.log('🖼️ Seeding slider images with order...');
    for (const imageData of sliderImages) {
      const sliderImage = new SliderImage(imageData);
      await sliderImage.save();
      console.log(`  ✅ Added slider image: ${imageData.title} (order: ${imageData.order})`);
    }

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   Areas: ${Object.keys(areas).length} (with order)`);
    console.log(`   Properties: ${properties.length} total (with property types)`);
    console.log(`     🏠 Residential: ${residentialCount}`);
    console.log(`     🏢 Commercial: ${commercialCount}`);
    console.log(`   Slider Images: ${sliderImages.length} (with order)`);
    console.log('\n🔄 All documents have order fields and property types!');
    console.log('\n🆕 New Features Added:');
    console.log('   ✅ Property Type field (residential/commercial)');
    console.log('   ✅ Enhanced filtering capabilities');
    console.log('   ✅ Property type badges and icons');
    console.log('   ✅ Smart property categorization');

    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seeding
console.log('🚀 Starting database seeding with property types...');
console.log('This will clear existing data and add fresh data with property types.');
console.log('Properties will include both residential and commercial types.');
console.log('');

seedDatabase();