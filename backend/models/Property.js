const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  // 🆕 UPDATED: Made beds and baths optional for commercial properties
  beds: {
    type: Number,
    required: false, // Changed from required: true to optional
    min: 0,
    default: null // Allow null values
  },
  baths: {
    type: Number,
    required: false, // Changed from required: true to optional
    min: 0,
    default: null // Allow null values
  },
  area: {
    type: String,
    required: true,
    trim: true
  },
  areaKey: {
    type: String,
    required: true,
    trim: true
  },
  // 🔧 FIXED: Property Type Field - Not required for backward compatibility
  propertyType: {
    type: String,
    enum: ['residential', 'commercial'],
    default: 'residential', // Default to residential
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  images: [{
    type: String,
    trim: true
  }],
  // 🆕 UPDATED: Links are now optional - removed required: true
  links: {
    acres99: {
      type: String,
      trim: true
      // removed required: true
    },
    magicbricks: {
      type: String,
      trim: true
      // removed required: true
    }
  },
  features: [{
    type: String,
    trim: true
  }],
  // Order field for drag & drop reordering
  order: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// 🔧 FIXED: Pre-save middleware to ensure propertyType is set
propertySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Ensure propertyType is set to default if not provided
  if (!this.propertyType) {
    this.propertyType = 'residential';
  }
  
  // 🆕 NEW: Clean up empty beds/baths for commercial properties
  if (this.propertyType === 'commercial') {
    // For commercial properties, beds/baths can be null or undefined
    if (this.beds === 0 || this.beds === '') {
      this.beds = null;
    }
    if (this.baths === 0 || this.baths === '') {
      this.baths = null;
    }
  } else {
    // For residential properties, ensure beds/baths have default values if not provided
    if (this.beds === null || this.beds === undefined || this.beds === '') {
      this.beds = 1; // Default to 1 bedroom for residential
    }
    if (this.baths === null || this.baths === undefined || this.baths === '') {
      this.baths = 1; // Default to 1 bathroom for residential
    }
  }
  
  // 🆕 NEW: Clean up empty links
  if (this.links) {
    // Remove empty link fields
    if (!this.links.acres99 || this.links.acres99.trim() === '') {
      this.links.acres99 = undefined;
    }
    if (!this.links.magicbricks || this.links.magicbricks.trim() === '') {
      this.links.magicbricks = undefined;
    }
    
    // If both links are empty, remove the links object
    if (!this.links.acres99 && !this.links.magicbricks) {
      this.links = undefined;
    }
  }
  
  next();
});

// 🆕 NEW: Virtual field to check if property has bedrooms/bathrooms info
propertySchema.virtual('hasBedsAndBaths').get(function() {
  return this.beds && this.beds > 0 && this.baths && this.baths > 0;
});

// 🆕 NEW: Virtual field to check if property has external links
propertySchema.virtual('hasExternalLinks').get(function() {
  return this.links && (this.links.acres99 || this.links.magicbricks);
});

// 🆕 NEW: Virtual field to get external links count
propertySchema.virtual('externalLinksCount').get(function() {
  if (!this.links) return 0;
  let count = 0;
  if (this.links.acres99) count++;
  if (this.links.magicbricks) count++;
  return count;
});

// 🆕 NEW: Virtual field to check if property is suitable for families (has beds/baths)
propertySchema.virtual('isFamilySuitable').get(function() {
  return this.propertyType === 'residential' && this.hasBedsAndBaths;
});

// Ensure virtual fields are included in JSON output
propertySchema.set('toJSON', { virtuals: true });
propertySchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Property', propertySchema);