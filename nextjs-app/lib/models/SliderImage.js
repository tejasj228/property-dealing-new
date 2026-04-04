import mongoose from 'mongoose';

const sliderImageSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  imageUrl: { type: String, required: true, trim: true },
  altText: { type: String, trim: true },
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

const SliderImage = mongoose.models.SliderImage || mongoose.model('SliderImage', sliderImageSchema);
export default SliderImage;
