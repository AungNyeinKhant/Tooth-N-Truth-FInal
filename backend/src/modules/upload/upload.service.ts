import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class UploadService {
  constructor(private configService: ConfigService) {
    // Configure Cloudinary
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  /**
   * Upload profile image to Cloudinary
   * Folder structure: TnT/profiles/{userId}/{timestamp}-{filename}
   */
  async uploadProfileImage(
    file: Express.Multer.File,
    userId: string,
  ): Promise<{ url: string; publicId: string }> {
    const timestamp = Date.now();
    const publicId = `TnT/profiles/${userId}/${timestamp}-${file.originalname.replace(/\s/g, '_')}`;

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          public_id: publicId,
          folder: 'TnT/profiles',
          resource_type: 'image',
          transformation: [
            { width: 500, height: 500, crop: 'fill', gravity: 'face' },
            { quality: 'auto' },
            { fetch_format: 'auto' },
          ],
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else if (result) {
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
            });
          } else {
            reject(new Error('Upload failed - no result'));
          }
        },
      );

      // Write the buffer to the upload stream
      uploadStream.end(file.buffer);
    });
  }

  /**
   * Delete profile image from Cloudinary
   */
  async deleteProfileImage(publicId: string): Promise<void> {
    await cloudinary.uploader.destroy(publicId);
  }

  /**
   * Get signed URL for private assets (if needed)
   */
  getSignedUrl(publicId: string, expiresIn: number = 3600): string {
    return cloudinary.url(publicId, {
      sign_url: true,
      expires_at: Math.floor(Date.now() / 1000) + expiresIn,
    });
  }
}
