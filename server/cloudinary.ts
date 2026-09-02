import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary with user's provided credentials
const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || 'zqh0eatl';
const API_KEY = process.env.CLOUDINARY_API_KEY || '832862255783111';
const API_SECRET = process.env.CLOUDINARY_API_SECRET || '';

if (API_SECRET) {
  cloudinary.config({
    cloud_name: CLOUD_NAME,
    api_key: API_KEY,
    api_secret: API_SECRET,
    secure: true,
  });
}

/**
 * Uploads an image (base64 data URL or remote URL) to Cloudinary
 * Returns the secure Cloudinary CDN URL or a reliable fallback.
 */
export async function uploadToCloudinary(
  imageSource: string,
  folder: string = 'instavibe'
): Promise<{ url: string; publicId?: string; provider: 'cloudinary' | 'direct' }> {
  const secret = process.env.CLOUDINARY_API_SECRET || API_SECRET;

  if (secret) {
    try {
      cloudinary.config({
        cloud_name: CLOUD_NAME,
        api_key: API_KEY,
        api_secret: secret,
        secure: true,
      });

      const uploadResponse = await cloudinary.uploader.upload(imageSource, {
        folder,
        resource_type: 'auto',
        transformation: [
          { quality: 'auto:good' },
          { fetch_format: 'auto' },
        ],
      });

      return {
        url: uploadResponse.secure_url,
        publicId: uploadResponse.public_id,
        provider: 'cloudinary',
      };
    } catch (error: any) {
      console.error('Cloudinary API upload error:', error.message);
      // If Cloudinary rejects (e.g. invalid secret), fallback gracefully
    }
  }

  // Fallback if CLOUDINARY_API_SECRET is not configured or fails
  console.log('Using direct image source URL (Cloudinary secret not provided or upload failed)');
  return {
    url: imageSource,
    provider: 'direct',
  };
}
