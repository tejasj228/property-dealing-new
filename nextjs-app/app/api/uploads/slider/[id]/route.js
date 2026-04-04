import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import SliderImage from '@/lib/models/SliderImage';
import { cloudinary } from '@/lib/cloudinary';

export async function DELETE(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const sliderImage = await SliderImage.findById(id);
    if (!sliderImage) return NextResponse.json({ success: false, message: 'Slider image not found' }, { status: 404 });

    if (sliderImage.imageUrl.includes('cloudinary.com')) {
      try {
        const urlParts = sliderImage.imageUrl.split('/');
        const publicIdWithExtension = urlParts[urlParts.length - 1];
        const publicId = publicIdWithExtension.split('.')[0];
        await cloudinary.uploader.destroy(`pawan-buildhome/${publicId}`);
      } catch (err) {
        console.warn('Error deleting from Cloudinary:', err.message);
      }
    }

    await SliderImage.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: 'Slider image deleted successfully' });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Error deleting slider image', error: error.message }, { status: 500 });
  }
}
