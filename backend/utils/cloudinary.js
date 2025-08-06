const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// Upload image to Cloudinary
const uploadImage = async (filePath, options = {}) => {
  try {
    const defaultOptions = {
      folder: 'civic-reporter',
      resource_type: 'image',
      quality: 'auto:good',
      fetch_format: 'auto',
      width: 1200,
      height: 1200,
      crop: 'limit'
    };

    const uploadOptions = { ...defaultOptions, ...options };
    
    const result = await cloudinary.uploader.upload(filePath, uploadOptions);
    
    return {
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      width: result.width,
      height: result.height,
      bytes: result.bytes
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload image to cloud storage');
  }
};

// Delete image from Cloudinary
const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === 'ok';
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw new Error('Failed to delete image from cloud storage');
  }
};

// Generate optimized image URL
const getOptimizedUrl = (publicId, options = {}) => {
  try {
    const defaultOptions = {
      quality: 'auto:good',
      fetch_format: 'auto',
      crop: 'fill',
      gravity: 'auto'
    };

    const transformOptions = { ...defaultOptions, ...options };
    
    return cloudinary.url(publicId, transformOptions);
  } catch (error) {
    console.error('Cloudinary URL generation error:', error);
    return null;
  }
};

// Generate thumbnail URL
const getThumbnailUrl = (publicId, width = 300, height = 300) => {
  return getOptimizedUrl(publicId, {
    width,
    height,
    crop: 'fill',
    quality: 'auto:low'
  });
};

// Validate Cloudinary configuration
const validateConfig = () => {
  const required = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.warn(`Missing Cloudinary configuration: ${missing.join(', ')}`);
    return false;
  }
  
  return true;
};

module.exports = {
  cloudinary,
  uploadImage,
  deleteImage,
  getOptimizedUrl,
  getThumbnailUrl,
  validateConfig
};