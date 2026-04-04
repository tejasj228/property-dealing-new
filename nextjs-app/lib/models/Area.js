import mongoose from 'mongoose';

const societySchema = new mongoose.Schema({
  id: { type: Number, required: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  mapImage: { type: String, trim: true, default: null },
  images: [{ type: String, trim: true }],
  amenities: [{ type: String, trim: true }],
  contact: { phone: String, email: String },
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  imageMetadata: [{
    url: String,
    caption: String,
    uploadedAt: { type: Date, default: Date.now },
  }],
  featuredImageIndex: { type: Number, default: 0 },
});

const subAreaSchema = new mongoose.Schema({
  id: { type: Number, required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  image: { type: String, trim: true, default: '/assets/map.webp' },
  mapImage: { type: String, trim: true, default: null },
  societies: [societySchema],
  order: { type: Number, default: 0 },
});

const areaSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, trim: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  subAreas: [subAreaSchema],
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

areaSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

const Area = mongoose.models.Area || mongoose.model('Area', areaSchema);
export default Area;
