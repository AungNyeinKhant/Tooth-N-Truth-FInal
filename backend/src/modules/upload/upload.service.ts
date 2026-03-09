import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

export type UserRole = 'patient' | 'manager' | 'doctor' | 'admin';

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
   * Get folder path based on user role
   */
  getFolderByRole(role: string): string {
    switch (role.toUpperCase()) {
      case 'PATIENT':
        return 'tnt-clinic/patients';
      case 'BRANCH_MANAGER':
        return 'tnt-clinic/managers';
      case 'DOCTOR':
        return 'tnt-clinic/doctors';
      case 'ADMIN':
        return 'tnt-clinic/admins';
      default:
        return 'tnt-clinic/others';
    }
  }

  /**
   * Validate file type and size
   */
  validateFile(file: Express.Multer.File): void {
    // Allowed types
    const allowedTypes = [
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/webp',
      'image/gif',
      'image/bmp',
      'image/tiff',
    ];
    
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Allowed: PNG, JPG, JPEG, WEBP, GIF, BMP, TIFF'
      );
    }

    // Max size: 2MB
    const maxSize = 2 * 1024 * 1024; // 2MB in bytes
    if (file.size > maxSize) {
      throw new BadRequestException('File must be under 2MB');
    }
  }

  /**
   * Upload profile image to Cloudinary
   * Folder structure: tnt-clinic/{role}s/{userId}/{timestamp}-{filename}
   */
  async uploadProfileImage(
    file: Express.Multer.File,
    userId: string,
    role: string,
  ): Promise<{ url: string; publicId: string }> {
    // Validate file first
    this.validateFile(file);

    const folder = this.getFolderByRole(role);
    const timestamp = Date.now();
    const safeFilename = file.originalname.replace(/\s/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
    const publicId = `${folder}/${userId}/${timestamp}-${safeFilename}`;

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          public_id: publicId,
          folder: folder,
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
   * Upload single image (reusable endpoint)
   */
  async uploadSingle(
    file: Express.Multer.File,
    folder: string = 'tnt-clinic',
  ): Promise<{ url: string; publicId: string }> {
    // Validate file first
    this.validateFile(file);

    const timestamp = Date.now();
    const safeFilename = file.originalname.replace(/\s/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
    const publicId = `${folder}/${timestamp}-${safeFilename}`;

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          public_id: publicId,
          folder: folder,
          resource_type: 'image',
          transformation: [
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

      uploadStream.end(file.buffer);
    });
  }

  /**
   * Delete profile image from Cloudinary by publicId
   */
  async deleteImage(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      console.error('Failed to delete from Cloudinary:', error);
      // Don't throw - continue even if delete fails
    }
  }

  /**
   * Delete image by URL
   */
  async deleteByUrl(imageUrl: string): Promise<void> {
    if (!imageUrl) return;

    try {
      // Extract public ID from URL
      // Format: https://res.cloudinary.com/{cloud_name}/image/upload/{version}/{folder}/{file}.{format}
      // Or: https://res.cloudinary.com/{cloud_name}/image/upload/{folder}/{file}.{format}
      
      // Find 'upload' in the URL and get everything after it
      const urlParts = imageUrl.split('/');
      const uploadIndex = urlParts.findIndex(part => part === 'upload');
      
      if (uploadIndex === -1) {
        console.error('Could not find upload in URL:', imageUrl);
        return;
      }
      
      // Get everything after 'upload'
      const publicIdParts = urlParts.slice(uploadIndex + 1);
      
      // Remove version number if present (starts with 'v' followed by numbers)
      const filteredParts = publicIdParts.filter(part => !/^v\d+$/.test(part));
      
      // Join and remove file extension
      const publicId = filteredParts.join('/').replace(/\.[^/.]+$/, '');
      
      if (!publicId) {
        console.error('Could not extract publicId from URL:', imageUrl);
        return;
      }

      console.log('[Cloudinary] Deleting image with publicId:', publicId);
      await cloudinary.uploader.destroy(publicId);
      console.log('[Cloudinary] Image deleted successfully');
    } catch (error) {
      console.error('[Cloudinary] Failed to delete image by URL:', error);
      // Don't throw - continue even if delete fails
    }
  }

  /**
   * Rollback: delete newly uploaded image on failure
   */
  async rollback(imageUrl: string): Promise<void> {
    await this.deleteByUrl(imageUrl);
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
