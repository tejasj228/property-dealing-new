import { NextResponse } from 'next/server';
import { uploadToCloudinary } from '@/lib/cloudinary';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('images');

    if (!files || files.length === 0) {
      return NextResponse.json({ success: false, message: 'No files uploaded' }, { status: 400 });
    }

    const uploadPromises = files.map((file, index) =>
      file.arrayBuffer().then(buf =>
        uploadToCloudinary(Buffer.from(buf), { public_id: `property-${Date.now()}-${index}`, resource_type: 'image' })
          .then(result => ({ result, file }))
      )
    );

    const results = await Promise.all(uploadPromises);

    const uploadedFiles = results.map(({ result, file }) => ({
      filename: result.public_id,
      originalName: file.name,
      imageUrl: result.secure_url,
      size: file.size,
      cloudinaryData: { public_id: result.public_id, version: result.version, format: result.format },
    }));

    return NextResponse.json({
      success: true,
      message: `${files.length} images uploaded successfully`,
      data: uploadedFiles,
    });
  } catch (error) {
    console.error('Error uploading images:', error);
    return NextResponse.json({ success: false, message: 'Error uploading images', error: error.message }, { status: 500 });
  }
}
