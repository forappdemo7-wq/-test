import { v2 as cloudinary } from 'cloudinary';
import { config } from '../config/env.config';
import { logger } from '../core/logger/logger';

if (config.cloudinary.isConfigured) {
  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
  });
}

export async function uploadToCloudinary(
  fileBase64OrUrl: string,
  folder: string = 'instavibe_uploads'
): Promise<{ url: string; publicId: string }> {
  try {
    if (!config.cloudinary.isConfigured || !fileBase64OrUrl.startsWith('data:')) {
      return {
        url: fileBase64OrUrl,
        publicId: `mock_${Date.now()}`,
      };
    }

    const result = await cloudinary.uploader.upload(fileBase64OrUrl, {
      folder,
      resource_type: 'auto',
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error) {
    logger.error('Cloudinary upload error, using raw file as fallback', error);
    return {
      url: fileBase64OrUrl,
      publicId: `fallback_${Date.now()}`,
    };
  }
}
