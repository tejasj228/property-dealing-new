const path = require('node:path');
const { loadEnvConfig } = require('@next/env');
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;

loadEnvConfig(path.resolve(__dirname, '..'));

async function checkMongoDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      autoIndex: false,
      autoCreate: false,
      serverSelectionTimeoutMS: 15000,
    });
    await mongoose.connection.db.admin().ping();
    console.log(`MongoDB: connected to ${mongoose.connection.name} (read-only ping).`);
  } catch (error) {
    console.error(`MongoDB: connection failed (${error.name}). Check Atlas IP access, network connectivity, and credentials.`);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

async function checkCloudinary() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    timeout: 15000,
  });
  try {
    const result = await cloudinary.api.ping();
    if (result.status !== 'ok') throw new Error('Unexpected ping response');
    console.log('Cloudinary: authenticated successfully (read-only ping).');
  } catch {
    console.error('Cloudinary: connection failed. Check its credentials and network connectivity.');
    process.exitCode = 1;
  }
}

Promise.allSettled([checkMongoDB(), checkCloudinary()]).then(results => {
  if (results.some(result => result.status === 'rejected')) {
    console.error('Connection check could not complete.');
    process.exitCode = 1;
  }
});
