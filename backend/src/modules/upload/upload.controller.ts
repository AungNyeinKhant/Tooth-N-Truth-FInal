import {
  Controller,
  Post,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Public } from '../../core/decorators';
import { JwtAuthGuard } from '../../core/guards';
import { CurrentUser } from '../../core/decorators';
import { UploadService } from './upload.service';
import { PrismaService } from '../../database/prisma/prisma.service';

@ApiTags('Upload')
@Controller('upload')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UploadController {
  constructor(
    private readonly uploadService: UploadService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('profile-image')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload profile image' })
  @ApiResponse({ status: 200, description: 'Profile image uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async uploadProfileImage(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('sub') userId: string,
  ) {
    if (!file) {
      throw new Error('No file provided');
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed');
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('File size too large. Maximum size is 5MB');
    }

    // Upload to Cloudinary
    const result = await this.uploadService.uploadProfileImage(file, userId);

    // Update user profile with new image URL
    await this.prisma.user.update({
      where: { id: userId },
      data: { profileImage: result.url },
    });

    return {
      url: result.url,
      message: 'Profile image uploaded successfully',
    };
  }

  @Delete('profile-image')
  @ApiOperation({ summary: 'Delete profile image' })
  @ApiResponse({ status: 200, description: 'Profile image deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deleteProfileImage(@CurrentUser('sub') userId: string) {
    // Get current profile image
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { profileImage: true },
    });

    if (user?.profileImage) {
      // Extract public ID from URL (basic approach)
      // Cloudinary URL format: https://res.cloudinary.com/{cloud_name}/image/upload/{public_id}
      const urlParts = user.profileImage.split('/');
      const publicIdWithExtension = urlParts.slice(-2).join('/');
      const publicId = `TnT/profiles/${userId}/${publicIdWithExtension.split('.')[0]}`;

      try {
        await this.uploadService.deleteProfileImage(publicId);
      } catch (error) {
        console.error('Failed to delete from Cloudinary:', error);
      }

      // Clear profile image in database
      await this.prisma.user.update({
        where: { id: userId },
        data: { profileImage: null },
      });
    }

    return { message: 'Profile image deleted successfully' };
  }
}
