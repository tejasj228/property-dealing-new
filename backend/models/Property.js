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
  beds: {
    type: Number,
    required: true
  },
  baths: {
    type: Number,
    required: true
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
  links: {
    acres99: {
      type: String,
      trim: true,
      required: true
    },
    magicbricks: {
      type: String,
      trim: true,
      required: true
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
  
  next();
});

module.exports = mongoose.model('Property', propertySchema);