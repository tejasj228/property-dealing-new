import mongoose from 'mongoose';

const propertySchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  price: { type: String, required: true, trim: true },
  location: { type: String, required: true, trim: true },
  beds: { type: Number, required: false, min: 0, default: null },
  baths: { type: Number, required: false, min: 0, default: null },
  area: { type: String, required: true, trim: true },
  areaKey: { type: String, required: true, trim: true },
  propertyType: {
    type: String,
    enum: ['residential', 'commercial'],
    default: 'residential',
    trim: true,
  },
  description: { type: String, trim: true },
  images: [{ type: String, trim: true }],
  links: {
    acres99: { type: String, trim: true },
    magicbricks: { type: String, trim: true },
  },
  features: [{ type: String, trim: true }],
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

propertySchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  if (!this.propertyType) this.propertyType = 'residential';

  if (this.propertyType === 'commercial') {
    if (this.beds === 0 || this.beds === '') this.beds = null;
    if (this.baths === 0 || this.baths === '') this.baths = null;
  } else {
    if (this.beds === null || this.beds === undefined || this.beds === '') this.beds = 1;
    if (this.baths === null || this.baths === undefined || this.baths === '') this.baths = 1;
  }

  if (this.links) {
    if (!this.links.acres99 || this.links.acres99.trim() === '') this.links.acres99 = undefined;
    if (!this.links.magicbricks || this.links.magicbricks.trim() === '') this.links.magicbricks = undefined;
    if (!this.links.acres99 && !this.links.magicbricks) this.links = undefined;
  }
  next();
});

propertySchema.virtual('hasBedsAndBaths').get(function () {
  return this.beds && this.beds > 0 && this.baths && this.baths > 0;
});

propertySchema.virtual('hasExternalLinks').get(function () {
  return this.links && (this.links.acres99 || this.links.magicbricks);
});

propertySchema.virtual('externalLinksCount').get(function () {
  if (!this.links) return 0;
  let count = 0;
  if (this.links.acres99) count++;
  if (this.links.magicbricks) count++;
  return count;
});

propertySchema.virtual('isFamilySuitable').get(function () {
  return this.propertyType === 'residential' && this.hasBedsAndBaths;
});

propertySchema.set('toJSON', { virtuals: true });
propertySchema.set('toObject', { virtuals: true });

const Property = mongoose.models.Property || mongoose.model('Property', propertySchema);
export default Property;
